import React from "react";
import { Plus } from "lucide-react";

interface TutorHeaderProps {
  onNewChat: () => void;
  topicTitle?: string;
  topicContext?: {
    subject?: string;
    className?: string;
    chapter?: string;
  };
}

export function TutorHeader({ onNewChat, topicTitle, topicContext }: TutorHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-background/80 backdrop-blur-2xl">
      <div className="flex items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">AI Tutor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            Your personal AI learning assistant
          </p>
        </div>

        {topicTitle && (
          <div className="hidden md:flex flex-col border-l border-border pl-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Currently Learning
            </span>
            <span className="text-sm font-semibold text-primary">{topicTitle}</span>
            {topicContext &&
              (topicContext.subject || topicContext.className || topicContext.chapter) && (
                <span className="mt-1 text-[11px] font-medium text-muted-foreground">
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

      <button
        onClick={onNewChat}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New Chat</span>
      </button>
    </header>
  );
}
