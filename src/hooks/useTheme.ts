import { useEffect } from "react";

export function useTheme() {
  const theme = "light";

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    window.localStorage.setItem("edusim-theme", "light");
  }, []);

  const toggleTheme = () => {
    // Theme toggle disabled to maintain minimalist light theme
  };

  return { theme, toggleTheme };
}
