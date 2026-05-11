import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Zap } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import "katex/dist/katex.min.css";

interface AIExplanationCardProps {
  content: string;
  isLoading?: boolean;
}

export function AIExplanationCard({ content, isLoading }: AIExplanationCardProps) {
  const { theme } = useTheme();

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
        <div className={`prose prose-indigo max-w-none ${theme === "dark" ? "prose-invert" : ""}
          prose-headings:text-primary dark:prose-headings:text-primary prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-4
          prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
          prose-strong:text-foreground prose-strong:font-bold
          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:space-y-2
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:space-y-2
          prose-li:text-foreground/90
          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-primary prose-blockquote:bg-secondary/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
        `}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </section>
  );
}
