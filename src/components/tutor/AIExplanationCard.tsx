import React from "react";
import { Zap } from "lucide-react";
import "katex/dist/katex.min.css";
import { TutorMarkdownRenderer } from "./TutorMarkdownRenderer";

interface AIExplanationCardProps {
  content: string;
  isLoading?: boolean;
}

export function AIExplanationCard({ content, isLoading }: AIExplanationCardProps) {
  if (!content || content.trim() === "") {
    return (
      <section className="glass-strong rounded-3xl p-6 border border-border flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Zap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground/60">No explanation available yet. Ask a question to get started.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-strong rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-5 bg-secondary rounded-full" />
          <div className="h-6 w-40 bg-secondary rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-secondary/50 rounded" />
          <div className="h-4 w-[90%] bg-secondary/50 rounded" />
          <div className="h-4 w-[95%] bg-secondary/50 rounded" />
          <div className="h-4 w-[85%] bg-secondary/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <section className="glass-strong rounded-3xl p-6 relative overflow-hidden flex flex-col max-h-[600px] border border-border shadow-xl transition-all">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -z-10" />
      
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-foreground">AI Analysis & Explanation</h3>
        </div>
        <div className="px-3 py-1 rounded-full bg-secondary/80 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Powered by GPT-4
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <TutorMarkdownRenderer content={content} density="spacious" />
      </div>
    </section>
  );
}
