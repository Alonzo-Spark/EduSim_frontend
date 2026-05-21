import React from "react";
import { Sparkles, MessageSquarePlus } from "lucide-react";

interface TutorHeaderProps {
  onNewChat: () => void;
  topicTitle?: string;
}

export function TutorHeader({ onNewChat, topicTitle }: TutorHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-[850px] items-center justify-between px-4 sm:px-6 h-16 shrink-0 bg-transparent">
      <div className="flex items-center gap-4" />

      <div className="flex items-center gap-2">
        <button 
          onClick={onNewChat} 
          className="flex items-center gap-2 h-9 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/20 hover:border-violet-400/40"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  );
}
