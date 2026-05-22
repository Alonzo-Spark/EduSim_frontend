import React from "react";
import { SunMoon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-xl bg-secondary/20 hover:bg-secondary/30">
      <SunMoon className="w-4 h-4" />
    </button>
  );
}

export default ThemeToggle;
