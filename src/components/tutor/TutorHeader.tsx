import React from "react";
import { Plus, Menu, User, History, Bell } from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";

interface TutorHeaderProps {
  onNewChat: () => void;
  topicTitle?: string;
  topicContext?: {
    subject?: string;
    className?: string;
    chapter?: string;
  };
  toggleHistory?: () => void;
}

export function TutorHeader({ onNewChat, topicTitle, topicContext, toggleHistory }: TutorHeaderProps) {
  const { setMobileOpen } = useSidebarStore();

  return (
    <header className="z-30 flex items-center justify-between shrink-0 pointer-events-auto mx-4 mt-4 mb-2 px-4 py-3 border border-border/80 bg-card/65 backdrop-blur-xl rounded-[24px] shadow-sm lg:mx-0 lg:mt-0 lg:mb-0 lg:w-full lg:h-16 lg:px-6 lg:py-4 lg:border-t-0 lg:border-x-0 lg:border-b lg:border-border/65 lg:bg-background/80 lg:rounded-none lg:shadow-none">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Global Sidebar Button (Hamburger Menu) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Chat History Button */}
        <button
          onClick={toggleHistory}
          className="lg:hidden w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm shrink-0"
          title="Toggle Chat History"
        >
          <History className="w-5 h-5" />
        </button>

        <div className="pl-1 shrink-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground">AI Tutor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden lg:block mt-0.5">
            Your personal AI learning assistant
          </p>
        </div>

        {topicTitle && (
          <div className="hidden md:flex lg:hidden flex-col border-l border-border pl-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/75">
              Currently Learning
            </span>
            <span className="text-xs font-semibold text-primary">{topicTitle}</span>
            {topicContext &&
              (topicContext.subject || topicContext.className || topicContext.chapter) && (
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  {[
                    topicContext.className,
                    topicContext.subject,
                    topicContext.chapter ? `Chapter: ${topicContext.chapter}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              )}
          </div>
        )}
      </div>

      {/* Right Controls - Mobile View */}
      <div className="flex items-center gap-3 lg:hidden">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary px-4 py-1.5 text-xs font-semibold text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>New</span>
        </button>

        {/* User Profile Button */}
        <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Right Controls - Laptop/Desktop View */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Notifications Bell */}
        <button className="relative w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border/80 shadow-sm hover:bg-secondary/50 transition-all hover:scale-105 active:scale-95 group cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
        </button>

        {/* User Profile Button */}
        <button className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shadow-sm cursor-pointer border border-sky-200 transition-all hover:scale-105 active:scale-95">
          <User className="w-5 h-5" />
        </button>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card hover:bg-secondary/50 px-5 text-sm font-semibold text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>New Chat</span>
        </button>
      </div>
    </header>
  );
}
