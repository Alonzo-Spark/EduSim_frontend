import { useEffect, useLayoutEffect, type MutableRefObject } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useScrollRestoration<T extends HTMLElement>(
  ref: MutableRefObject<T | null>,
  storageKey: string,
) {
  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") {
      return;
    }

    const savedTop = Number(window.sessionStorage.getItem(storageKey) ?? "0");
    element.scrollTop = Number.isFinite(savedTop) ? savedTop : 0;
    element.scrollLeft = 0;
  }, [ref, storageKey]);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") {
      return;
    }

    const saveScrollPosition = () => {
      window.sessionStorage.setItem(storageKey, String(element.scrollTop));
    };

    const handlePageHide = () => {
      saveScrollPosition();
    };

    saveScrollPosition();
    element.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      saveScrollPosition();
      element.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [ref, storageKey]);
}