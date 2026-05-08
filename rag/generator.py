from app.src.modules.shared.gemini_service import generate_text


def generate_gemini_text(final_prompt: str, temperature: float = 0.3, max_output_tokens: int = 2048):
    """Generate raw text from Gemini using the shared backend Gemini service."""
    return generate_text(
        final_prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        cache_namespace="rag.generator",
    )



def generate_response(context: str, question: str):
    final_prompt = (
        "You are a helpful educational tutor. Use the textbook context to answer clearly and accurately.\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{question}\n\n"
        "Give a concise educational answer grounded in the context."
    )
    return generate_text(final_prompt, temperature=0.2, max_output_tokens=1024, cache_namespace="rag.response")


def generate_structured_response(system_prompt: str, user_query: str):
    final_prompt = (
        f"System Instructions:\n{system_prompt}\n\n"
        f"User Input:\n{user_query}\n\n"
        "Return only the requested output format."
    )
    return generate_text(final_prompt, temperature=0.2, max_output_tokens=2048, cache_namespace="rag.structured")