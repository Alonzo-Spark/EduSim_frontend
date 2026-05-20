import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { User, Bot, Copy, RefreshCw } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useMounted } from "@/hooks/useMounted";

interface ChatBubbleProps {
  content: string;
  role: "user" | "ai";
  timestamp?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function ChatBubble({ content, role, timestamp, onCopy, onRegenerate }: ChatBubbleProps) {
  const isAi = role === "ai";
  const { theme } = useTheme();
  const mounted = useMounted();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 mb-4 ${isAi ? "flex-row" : "flex-row-reverse"}`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          isAi
            ? "bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] glow-purple"
            : "bg-secondary border border-border"
        }`}
      >
        {isAi ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div className={`flex flex-col ${isAi ? "max-w-[min(78rem,88%)] items-start" : "max-w-[min(46rem,72%)] items-end"}`}>
        <div className="relative">
          <div
            className={`px-6 py-5 rounded-[1.75rem] text-[15px] leading-7 shadow-lg ${
              isAi
                ? "glass-strong border border-white/10 bg-white/5 text-foreground shadow-[0_16px_50px_rgba(0,0,0,0.25)]"
                : "border border-violet-400/30 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_16px_50px_rgba(99,102,241,0.35)]"
            }`}
          >
            <div className={`prose prose-sm max-w-none ${mounted && theme === 'dark' ? 'prose-invert' : ''}`}>
              <ReactMarkdown>
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {isAi && (
            <div className="absolute -top-3 right-2 flex items-center gap-2">
              <button type="button" title="Copy message" onClick={onCopy} className="rounded-md bg-background/80 p-1.5 shadow-sm ring-1 ring-border/40 hover:bg-secondary/20">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              <button type="button" title="Regenerate response" onClick={onRegenerate} className="rounded-md bg-background/80 p-1.5 shadow-sm ring-1 ring-border/40 hover:bg-secondary/20">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-2 px-1">{timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}

export function TypingAnimation() {
  return (
    <div className="flex gap-1 px-4 py-3 rounded-2xl glass-strong border-white/5 w-fit">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)]"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
        className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)]"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
        className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)]"
      />
    </div>
  );
}
