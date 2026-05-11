import { Bell, Moon, Sun, User, Menu, PanelLeft } from "lucide-react";
import { GlobalSearch } from "./layout/GlobalSearch";
import { useTheme } from "@/hooks/useTheme";
import { useSidebarStore } from "@/store/useSidebarStore";
import { motion } from "framer-motion";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar, setMobileOpen, isCollapsed } = useSidebarStore();

  return (
    <header className="sticky top-0 z-[60] w-full px-4 pt-4 pb-2 md:px-6">
      <div className="mx-auto flex items-center justify-between gap-4 backdrop-blur-xl bg-background/60 border border-border/50 px-4 py-3 rounded-[2rem] shadow-2xl">
        
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-all"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button 
            onClick={toggleSidebar}
            className="hidden md:flex w-10 h-10 rounded-xl items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-all group"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <PanelLeft className={`w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors ${isCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-3xl mx-auto">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-all hover:scale-105 active:scale-95"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          <button className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-secondary/50 border border-border hover:bg-secondary transition-all relative hover:scale-105 active:scale-95">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
          </button>

          <div className="flex items-center pl-2 border-l border-border/50">
            <button className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
