from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from threading import Event, Lock
from typing import Any

import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[4] / ".env")

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_FALLBACK_MODEL = "gemini-flash-latest"
CACHE_FILE = Path("data/gemini_cache.json")


class GeminiServiceError(RuntimeError):
    pass


class GeminiRateLimitError(GeminiServiceError):
    pass


class GeminiAuthError(GeminiServiceError):
    pass


class GeminiTimeoutError(GeminiServiceError):
    pass


@dataclass(frozen=True)
class GeminiRequestOptions:
    prompt: str
    temperature: float = 0.3
    max_output_tokens: int = 2048
    cache_namespace: str = "default"
    model_name: str = GEMINI_MODEL


_cache_lock = Lock()
_cache_loaded = False
_cache: dict[str, dict[str, Any]] = {}
_in_flight: dict[str, Event] = {}
_in_flight_error: dict[str, Exception] = {}


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _cache_key(options: GeminiRequestOptions) -> str:
    payload = {
        "prompt": _normalize_text(options.prompt),
        "temperature": options.temperature,
        "max_output_tokens": options.max_output_tokens,
        "cache_namespace": options.cache_namespace,
        "model_name": options.model_name,
    }
    encoded = json.dumps(payload, sort_keys=True, ensure_ascii=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _ensure_cache_loaded() -> None:
    global _cache_loaded, _cache
    if _cache_loaded:
        return

    if CACHE_FILE.exists():
        try:
            with CACHE_FILE.open("r", encoding="utf-8") as file:
                loaded = json.load(file)
                if isinstance(loaded, dict):
                    _cache = loaded
        except Exception as exc:
            print(f"Gemini cache load failed: {exc}")

    _cache_loaded = True


def _persist_cache() -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE_FILE.open("w", encoding="utf-8") as file:
        json.dump(_cache, file, indent=2, ensure_ascii=True)


def _get_cached_text(cache_key: str) -> str | None:
    _ensure_cache_loaded()
    entry = _cache.get(cache_key)
    if isinstance(entry, dict):
        text = entry.get("text")
        if isinstance(text, str) and text.strip():
            return text
    return None


def _store_cache(cache_key: str, text: str, options: GeminiRequestOptions) -> None:
    _ensure_cache_loaded()
    _cache[cache_key] = {
        "text": text,
        "updated_at": time.time(),
        "cache_namespace": options.cache_namespace,
        "model_name": options.model_name,
        "temperature": options.temperature,
        "max_output_tokens": options.max_output_tokens,
    }
    _persist_cache()


def _configure_model(model_name: str):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise GeminiAuthError("GOOGLE_API_KEY is missing. Configure it in .env to enable Gemini generation.")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


def _classify_exception(exc: Exception) -> str:
    message = str(exc).lower()
    status_code = getattr(exc, "status_code", None)
    if status_code is None:
        response = getattr(exc, "response", None)
        status_code = getattr(response, "status_code", None)

    if status_code == 429 or any(token in message for token in ("quota exceeded", "rate limit", "too many requests", "resource_exhausted")):
        return "rate_limit"
    if status_code in {401, 403} or any(token in message for token in ("api key", "invalid api key", "permission denied", "unauthorized")):
        return "auth"
    if status_code in {408, 504} or any(token in message for token in ("timeout", "timed out", "deadline exceeded")):
        return "timeout"
    if status_code is not None and 500 <= status_code < 600:
        return "network"
    if any(token in message for token in ("connection", "network", "temporarily unavailable", "internal server error")):
        return "network"
    return "other"


def _to_service_error(exc: Exception) -> GeminiServiceError:
    kind = _classify_exception(exc)
    message = str(exc)
    if kind == "rate_limit":
        return GeminiRateLimitError(message)
    if kind == "auth":
        return GeminiAuthError(message)
    if kind == "timeout":
        return GeminiTimeoutError(message)
    return GeminiServiceError(message)


def _backoff_delay(attempt: int) -> float:
    return min(8.0, 0.75 * (2 ** attempt))


def _generate_once(options: GeminiRequestOptions) -> str:
    last_error: Exception | None = None

    for model_name in (options.model_name, GEMINI_FALLBACK_MODEL):
        try:
            model = _configure_model(model_name)
            response = model.generate_content(
                options.prompt,
                generation_config={
                    "temperature": options.temperature,
                    "max_output_tokens": options.max_output_tokens,
                },
            )
            generated_text = getattr(response, "text", None)
            if not generated_text:
                raise GeminiServiceError("Gemini returned an empty response.")
            return generated_text.strip()
        except Exception as exc:
            last_error = exc if isinstance(exc, Exception) else GeminiServiceError(str(exc))
            if model_name != GEMINI_FALLBACK_MODEL:
                print(f"Gemini primary model failed ({model_name}); trying fallback {GEMINI_FALLBACK_MODEL}: {exc}")

    assert last_error is not None
    raise _to_service_error(last_error)


def generate_text(
    prompt: str,
    temperature: float = 0.3,
    max_output_tokens: int = 2048,
    cache_namespace: str = "default",
    model_name: str = GEMINI_MODEL,
) -> str:
    options = GeminiRequestOptions(
        prompt=prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        cache_namespace=cache_namespace,
        model_name=model_name,
    )
    cache_key = _cache_key(options)

    cached = _get_cached_text(cache_key)
    if cached is not None:
        print(f"Gemini cache hit: {cache_namespace}:{cache_key[:12]}")
        return cached

    with _cache_lock:
        cached = _get_cached_text(cache_key)
        if cached is not None:
            print(f"Gemini cache hit: {cache_namespace}:{cache_key[:12]}")
            return cached

        if cache_key in _in_flight:
            event = _in_flight[cache_key]
            print(f"Gemini request deduped: {cache_namespace}:{cache_key[:12]}")
            owner = False
        else:
            event = Event()
            _in_flight[cache_key] = event
            owner = True

    if not owner:
        event.wait()
        with _cache_lock:
            error = _in_flight_error.pop(cache_key, None)
            cached = _get_cached_text(cache_key)
            if cached is not None:
                return cached
            if error is not None:
                raise _to_service_error(error)
        raise GeminiServiceError("Gemini request failed.")

    try:
        print(f"Gemini request start: {cache_namespace}:{cache_key[:12]}")
        attempts = 0
        max_retries = 3
        last_error: Exception | None = None

        while attempts <= max_retries:
            try:
                text = _generate_once(options)
                _store_cache(cache_key, text, options)
                print(f"Gemini request success: {cache_namespace}:{cache_key[:12]}")
                return text
            except Exception as exc:
                last_error = exc if isinstance(exc, Exception) else GeminiServiceError(str(exc))
                error_kind = _classify_exception(last_error)
                if error_kind == "auth":
                    print(f"Gemini auth failure: {last_error}")
                    raise _to_service_error(last_error)

                if attempts >= max_retries or error_kind not in {"rate_limit", "timeout", "network"}:
                    print(f"Gemini request failure: {cache_namespace}:{cache_key[:12]} -> {last_error}")
                    raise _to_service_error(last_error)

                delay = _backoff_delay(attempts)
                print(f"Gemini retry attempt {attempts + 1}/{max_retries} after {delay:.2f}s: {last_error}")
                time.sleep(delay)
                attempts += 1

        assert last_error is not None
        raise _to_service_error(last_error)
    except Exception as exc:
        with _cache_lock:
            _in_flight_error[cache_key] = exc if isinstance(exc, Exception) else GeminiServiceError(str(exc))
        raise
    finally:
        with _cache_lock:
            event = _in_flight.pop(cache_key, None)
            if event is not None:
                event.set()
