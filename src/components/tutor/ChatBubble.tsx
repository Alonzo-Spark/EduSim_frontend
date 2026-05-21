import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Activity } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import { useTutorStore } from "@/store/tutorStore";
import { TutorMarkdownRenderer } from "./TutorMarkdownRenderer";
import { extractFormulas } from "@/utils/formulaParser";
import { DynamicFormulaExtractor, DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";

const InteractiveFormulaCard = React.lazy(() => import("./InteractiveFormulaCard"));
const FormulaLabPageLazy = React.lazy(() => import("@/components/formula-lab/FormulaLabPage"));

interface ChatBubbleProps {
  content: string;
  role: "user" | "ai";
  timestamp?: string;
  topicTitle?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function ChatBubble({ content, role, timestamp, topicTitle, onCopy, onRegenerate }: ChatBubbleProps) {
  const isAi = role === "ai";
  const mounted = useMounted();
  const {
    activeFormulaId,
    setActiveFormulaId,
    showInlineFormulaLab,
    setShowInlineFormulaLab,
    inlineRagContent,
    setInlineRagContent,
  } = useTutorStore();

  const formulas = useMemo(() => {
    if (!isAi) return [];
    return extractFormulas(content);
  }, [content, isAi]);

  const shouldShowFormulaLab = isAi && showInlineFormulaLab && inlineRagContent === content;

  if (isAi) {
    console.log("[TutorOutputPanel] showFormulaLab", formulas.length);
  }

  let mainContent = content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-2 ${isAi ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`flex flex-col w-full ${isAi ? "max-w-[800px] items-start" : "max-w-[450px] items-end"}`}
      >
        <div
          className={`relative group flex items-start gap-3 w-fit ${isAi ? "" : "flex-row-reverse"}`}
        >
          {isAi && (
            <div className="w-10 h-10 mt-1 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] glow-purple shadow-lg">
              <span className="text-white text-xs font-bold tracking-wider">AI</span>
            </div>
          )}

          <div
            className={`relative px-6 py-5 rounded-[24px] text-[15px] leading-7 shadow-lg transition-all ${
              isAi
                ? "glass-card border border-white/10 bg-white/5 text-foreground rounded-tl-sm shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
                : "border border-violet-400/20 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-[0_10px_30px_rgba(99,102,241,0.25)]"
            }`}
          >
            {isAi ? (
              <TutorMarkdownRenderer
                content={mainContent}
                density="comfortable"
                className={mounted ? "" : ""}
              />
            ) : (
              <div className="whitespace-pre-wrap">{content}</div>
            )}

            {isAi && formulas.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-center w-full">
                <button
                  onClick={() => {
                    setInlineRagContent(content);
                    setShowInlineFormulaLab(true);
                  }}
                  className="group relative flex items-center gap-3 rounded-[2rem] bg-gradient-to-r from-violet-600/80 to-indigo-600/80 hover:from-violet-500 hover:to-indigo-500 border border-violet-400/30 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-0.5 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Activity className="h-5 w-5 text-violet-200" />
                  <span>Explore in Formula Lab</span>
                </button>
              </div>
            )}

            {isAi && (
              <div className="absolute -top-3 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Copy"
                  onClick={onCopy}
                  className="rounded-full bg-background border border-border p-1.5 shadow-md hover:bg-secondary"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  title="Regenerate"
                  onClick={onRegenerate}
                  className="rounded-full bg-background border border-border p-1.5 shadow-md hover:bg-secondary"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>

        {timestamp && (
          <span
            className={`text-[11px] text-muted-foreground/60 mt-1.5 px-2 ${isAi ? "ml-12" : "mr-2"}`}
          >
            {timestamp}
          </span>
        )}

        <AnimatePresence>
          {isAi && console.log("[TutorOutputPanel] showFormulaLab", formulas.length)}
          {isAi && formulas.some((f) => (f.rawFormula || f.raw) === activeFormulaId) && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="w-full ml-12 overflow-hidden"
            >
              <React.Suspense
                fallback={<div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />}
              >
                <InteractiveFormulaCard formulaRaw={activeFormulaId!} />
              </React.Suspense>
            </motion.div>
          )}

          {shouldShowFormulaLab && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="w-full ml-12 overflow-hidden"
            >
              <React.Suspense
                fallback={<div className="h-48 w-full animate-pulse rounded-2xl bg-white/5" />}
              >
                <FormulaLabPageLazy topic={topicTitle || "General"} ragContent={mainContent} />
              </React.Suspense>
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </motion.div>
  );
}

export function TypingAnimation() {
  return (
    <div className="flex gap-1.5 px-5 py-4 rounded-[24px] rounded-tl-sm glass-card border border-white/10 w-fit items-center h-[68px]">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="w-2 h-2 rounded-full bg-violet-400"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
        className="w-2 h-2 rounded-full bg-violet-400"
      />
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
        className="w-2 h-2 rounded-full bg-violet-400"
      />
    </div>
  );
}
