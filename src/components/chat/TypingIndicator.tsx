import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TypingIndicatorProps {
  streamingText?: string;
  isStreaming: boolean;
}

export function TypingIndicator({ streamingText, isStreaming }: TypingIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <div className="flex w-full animate-pulse justify-start animate-in fade-in duration-300">
      <div className="max-w-[90%] md:max-w-[85%] flex gap-3">
        {/* Glowing Brain Loading Icon */}
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-glow to-purple-glow grid place-items-center shrink-0 shadow-glow-indigo/20">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>

        {/* Streaming Text Card or Typing Dots */}
        <div className="rounded-2xl px-4 py-3.5 bg-card/75 border border-border/80 text-foreground/90 text-sm shadow-sm">
          {streamingText ? (
            <div className="prose prose-invert max-w-none prose-p:my-2 prose-strong:text-indigo-glow prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-card/80 prose-pre:border prose-pre:border-border/60">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-glow animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow animate-bounce [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-glow animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-muted-foreground ml-1 font-medium">EduSim is thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
