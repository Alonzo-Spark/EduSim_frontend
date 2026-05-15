import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import "katex/dist/katex.min.css";
import { User, Bot } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ChatBubbleProps {
  content: string;
  role: "user" | "ai";
  timestamp?: string;
}

export function ChatBubble({ content, role, timestamp }: ChatBubbleProps) {
  const isAi = role === "ai";
  const { theme } = useTheme();

  const warningText1 = "This topic is not available in the provided textbook context.";
  const warningText2 = "The following explanation is AI-generated and may not exactly match your textbook.";
  
  const hasWarning = content.includes(warningText1) || content.includes(warningText2);
  let cleanContent = content;
  if (hasWarning) {
      cleanContent = cleanContent
        .replace(warningText1, "")
        .replace(warningText2, "")
        .trim();
  }

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
      <div className={`flex flex-col max-w-[80%] ${isAi ? "items-start" : "items-end"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isAi
              ? "glass-strong border-primary/20 text-foreground"
              : "bg-primary/10 border border-primary/30 text-foreground"
          }`}
        >
          <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
            {hasWarning && (
              <div className="text-red-500 font-semibold mb-4 space-y-1">
                <p>{warningText1}</p>
                <p>{warningText2}</p>
              </div>
            )}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1 px-1">{timestamp}</span>
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
