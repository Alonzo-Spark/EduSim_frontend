import React from "react";
import { Moon, Bell, User } from "lucide-react";

interface TutorHeaderProps {
  onNewChat: () => void;
  topicTitle?: string;
}

export function TutorHeader({ onNewChat, topicTitle }: TutorHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between px-6 py-4 border-b border-border/20 bg-background/80 backdrop-blur-2xl">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">AI Tutor</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Your personal AI learning assistant</p>
        </div>
        
        {topicTitle && (
          <div className="hidden md:flex flex-col border-l border-white/10 pl-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Currently Learning</span>
            <span className="text-sm font-semibold text-violet-300">{topicTitle}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button 
          type="button" 
          title="Toggle Theme"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <Moon className="h-4.5 w-4.5" />
        </button>
        <button 
          type="button" 
          title="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>
        </button>
        <button 
          type="button" 
          title="Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
