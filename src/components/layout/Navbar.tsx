import { Bell, Moon, Sun, User, Menu } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { useTheme } from "@/hooks/useTheme";
import { useSidebarStore } from "@/store/useSidebarStore";
import { motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { setMobileOpen, isCollapsed } = useSidebarStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [mounted, setMounted] = useState(false);
  const hideSearch = pathname === "/tutor";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed top-4 left-0 right-0 z-[50] pointer-events-none px-4 md:px-0">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mx-auto max-w-7xl w-full h-14 flex items-center justify-between px-6 pointer-events-none"
      >
        <div className="flex items-center gap-3 shrink-0 pointer-events-auto">
          <button 
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-12 h-12 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg hover:bg-secondary transition-all hover:scale-105 active:scale-95"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Centered Search Bar Section */}
        <div className="flex-1 flex justify-center min-w-0 px-4 pointer-events-auto">
          <div className="w-full max-w-3xl">
            {!hideSearch && <GlobalSearch />}
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 pointer-events-auto">
          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg hover:bg-secondary transition-all hover:scale-105 active:scale-95 group"
            title="Toggle Theme"
          >
            {!mounted ? (
              <div className="w-5 h-5" />
            ) : theme === "light" ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          <button className="hidden sm:flex w-12 h-12 rounded-full items-center justify-center bg-background/80 backdrop-blur-xl border border-border/40 shadow-lg hover:bg-secondary transition-all relative hover:scale-105 active:scale-95 group">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            <span className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          </button>

          <button className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border border-white/20">
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </motion.header>
    </div>
  );
}
