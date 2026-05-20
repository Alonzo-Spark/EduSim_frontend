import React, { useState } from "react";
import { Home, Compass, BookOpen, Bookmark, Settings, SunMoon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const items = [
  { key: "tutor", label: "AI Tutor", icon: BookOpen, to: "/tutor" },
  { key: "explore", label: "Explore", icon: Compass, to: "/explore" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, to: "/favorites" },
  { key: "settings", label: "Settings", icon: Settings, to: "/settings" },
];

export function TutorSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`flex flex-col justify-between items-center py-4 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      <div>
        <div className="flex flex-col items-center gap-3 mb-6 px-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="text-center">
              <h3 className="text-sm font-bold">AI Tutor</h3>
              <p className="text-xs text-muted-foreground/60">Personal workspace</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((s) => !s)}
            aria-label="Toggle sidebar"
            className="mt-2 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex flex-col gap-3 items-center px-2">
          {items.map((it) => {
            const Icon = it.icon as any;
            return (
              <a
                key={it.key}
                href={it.to}
                aria-label={it.label}
                className={`flex items-center justify-center w-12 h-12 rounded-lg hover:scale-105 transition-transform ${it.key === 'tutor' ? 'bg-secondary/30 border border-border' : ''}`}
              >
                <Icon className="w-5 h-5 text-primary" />
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-2 w-full flex justify-center">
        <button onClick={toggleTheme} aria-label="Toggle theme" className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center hover:scale-105">
          <SunMoon className="w-4 h-4 text-primary" />
        </button>
      </div>
    </aside>
  );
}

export default TutorSidebar;
