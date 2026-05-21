import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, Copy, RefreshCw, Activity } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { extractFormulas } from "@/utils/formulaParser";
import { useTutorStore } from "@/store/tutorStore";
import { TutorMarkdownRenderer } from "./TutorMarkdownRenderer";

// Lazy load the InteractiveFormulaCard and FormulaLabPage so they don't block initial render
const InteractiveFormulaCard = React.lazy(() => import("./InteractiveFormulaCard"));
const FormulaLabPageLazy = React.lazy(() => import("@/components/formula-lab/FormulaLabPage"));

interface ChatBubbleProps {
  content: string;
  role: "user" | "ai";
  timestamp?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function ChatBubble({ content, role, timestamp, onCopy, onRegenerate }: ChatBubbleProps) {
  const isAi = role === "ai";
  const mounted = useMounted();
  const { activeFormulaId, setActiveFormulaId, showInlineFormulaLab, setShowInlineFormulaLab, inlineRagContent, setInlineRagContent } = useTutorStore();

  const formulas = useMemo(() => {
    if (!isAi) return [];
    return extractFormulas(content);
  }, [content, isAi]);

  // If there are formulas in this message and one of them is the active one, we show the card.
  // Wait, the card should probably be tied to the message or the formula itself.
  // For simplicity, let's allow expanding the active formula right below the message.

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 mb-4 w-full ${isAi ? "flex-row" : "flex-row-reverse"}`}
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
        <div className="relative group">
          <div
            className={`px-6 py-5 rounded-[1.75rem] text-[15px] leading-7 shadow-lg ${
              isAi
                ? "glass-strong border border-white/10 bg-white/5 text-foreground shadow-[0_16px_50px_rgba(0,0,0,0.25)]"
                : "border border-violet-400/30 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_16px_50px_rgba(99,102,241,0.35)]"
            }`}
          >
            <TutorMarkdownRenderer content={content} density="compact" className={`text-[15px] leading-7 ${mounted ? "" : ""}`} />
            
            {isAi && formulas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => {
                    setInlineRagContent(content);
                    setShowInlineFormulaLab(true);
                  }}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-1.5 text-sm font-semibold text-black shadow-lg hover:scale-105"
                >
                  Open Formula Lab
                </button>
                {formulas.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFormulaId(activeFormulaId === f.raw ? null : f.raw)}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Explain {f.matchedDefinition?.title || f.raw}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAi && (
            <div className="absolute -top-3 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

        <AnimatePresence>
          <AnimatePresence>
            {isAi && formulas.some(f => f.raw === activeFormulaId) && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="w-full overflow-hidden"
              >
                <React.Suspense fallback={<div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />}>
                  <InteractiveFormulaCard formulaRaw={activeFormulaId!} />
                </React.Suspense>
              </motion.div>
            )}

            {isAi && showInlineFormulaLab && inlineRagContent === content && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden mt-4"
              >
                <React.Suspense fallback={<div className="h-48 w-full animate-pulse rounded-2xl bg-white/5" />}>
                  <FormulaLabPageLazy topic={undefined as any} ragContent={content} />
                </React.Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>

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
