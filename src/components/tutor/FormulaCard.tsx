import React, { useState } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { useTutorStore } from "@/store/tutorStore";
import { Activity, Copy, Eye, HelpCircle, Check } from "lucide-react";

interface VariableDef {
  symbol: string;
  meaning: string;
}

interface FormulaCardData {
  formula: string;
  variables: VariableDef[];
  explanation: string;
  title?: string;
}

// ---------------------------------------------------------------------------
// Parser — extracts formula, variable definitions, and explanation from
// the markdown body of a section already classified as kind === "formula"
// by the existing section splitter.
// ---------------------------------------------------------------------------

const LATEX_BLOCK_RE = /\$\$\s*([\s\S]*?)\s*\$\$/;
const INLINE_LATEX_RE = /^\$([^$\n]+)\$$/;
const VAR_DEF_LINE_RE = /^[*-]?\s*\**([A-Za-zα-ωΑ-Ω_][A-Za-z0-9_₀-₉²³]*)\**\s*[=:–—]\s*(.+)$/;
const FORMULA_OPERATOR_RE = /[=∝→⇒⇌↔≈]/;

function isMathString(str: string): boolean {
  if (!FORMULA_OPERATOR_RE.test(str)) return false;
  if (str.split(/\s+/).length > 12) return false;
  return true;
}

export function parseFormulaBody(body: string, sectionTitle?: string): FormulaCardData {
  const lines = body.replace(/\r\n/g, "\n").split("\n");

  let formula = "";
  const variables: VariableDef[] = [];
  const explanationLines: string[] = [];
  let inWhereBlock = false;

  // First pass — try to extract LaTeX blocks that may span multiple lines
  const fullText = body.replace(/\r\n/g, "\n");
  const latexBlockMatch = fullText.match(LATEX_BLOCK_RE);
  if (latexBlockMatch) {
    formula = latexBlockMatch[1].trim();
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Skip action-button / formula-lab lines
    if (/open formula lab|explore.*formula lab|formula lab|explain formula/i.test(trimmed)) {
      continue;
    }

    // Skip the LaTeX block we already captured
    if (formula && /^\$\$/.test(trimmed)) {
      // Skip until closing $$
      while (i < lines.length && !/\$\$\s*$/.test(lines[i].trim().slice(2))) {
        if (/\$\$\s*$/.test(lines[i].trim())) break;
        i++;
      }
      continue;
    }

    // Inline LaTeX as formula
    if (!formula) {
      const inlineMatch = trimmed.match(INLINE_LATEX_RE);
      if (inlineMatch && isMathString(inlineMatch[1])) {
        formula = inlineMatch[1].trim();
        continue;
      }
    }

    // "Where:" header
    if (/^(?:\*\*)?where\s*:?\s*(?:\*\*)?$/i.test(trimmed)) {
      inWhereBlock = true;
      continue;
    }

    // Variable definition lines (inside or after Where block)
    if (inWhereBlock) {
      const varMatch = trimmed.match(VAR_DEF_LINE_RE);
      if (varMatch) {
        variables.push({
          symbol: varMatch[1].trim(),
          meaning: varMatch[2].trim().replace(/\*+$/g, ""),
        });
        continue;
      }
      // Empty line or non-matching → end where block
      inWhereBlock = false;
    }

    // Plain-text formula (first equation-like line)
    if (!formula && isMathString(trimmed) && trimmed.split(/\s+/).length <= 10) {
      // Strip surrounding $ if present
      formula = trimmed.replace(/^\$|\$$/g, "");
      continue;
    }

    // Variable definitions outside explicit Where block
    // (only if we already have at least one variable or the line clearly looks like one)
    const varMatch = trimmed.match(VAR_DEF_LINE_RE);
    if (varMatch) {
      const sym = varMatch[1].trim();
      // Only accept if the symbol is short (1-4 chars) — avoids false positives on prose
      if (sym.length <= 4) {
        variables.push({ symbol: sym, meaning: varMatch[2].trim().replace(/\*+$/g, "") });
        continue;
      }
    }

    // Prose → explanation (max 2 lines)
    if (explanationLines.length < 2) {
      const prose = trimmed.replace(/^[-*•]\s*/, "").replace(/\*+/g, "");
      if (prose.length > 5 && !FORMULA_OPERATOR_RE.test(prose)) {
        explanationLines.push(prose);
      }
    }
  }

  // Fallback: section title as formula
  if (!formula && sectionTitle && isMathString(sectionTitle)) {
    formula = sectionTitle;
  }

  const explanation = explanationLines.slice(0, 2).join(" ");
  return { formula, variables, explanation, title: sectionTitle };
}

// ---------------------------------------------------------------------------
// FormulaCard component — textbook reference card
// ---------------------------------------------------------------------------

interface FormulaCardProps {
  body: string;
  sectionTitle?: string;
  className?: string;
  parentContent?: string;
}

export function FormulaCard({ body, sectionTitle, className, parentContent }: FormulaCardProps) {
  const data = parseFormulaBody(body, sectionTitle);
  const [copied, setCopied] = useState(false);
  const { setActiveFormulaId, setShowInlineFormulaLab, setInlineRagContent } = useTutorStore();

  if (!data.formula) return null;

  const hasVariables = data.variables.length > 0;
  const hasExplanation = Boolean(data.explanation);

  const renderFormula = () => {
    try {
      return <BlockMath math={data.formula} />;
    } catch {
      return (
        <p className="text-2xl sm:text-3xl font-semibold text-center font-mono text-foreground">
          {data.formula}
        </p>
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-500/10 bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-5 sm:p-6 shadow-[0_0_30px_rgba(139,92,246,0.06)] hover:shadow-[0_0_40px_rgba(139,92,246,0.12)] hover:border-violet-500/20 transition-all duration-300 w-full min-w-0 max-w-full relative overflow-hidden",
        className,
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-2xl -z-10" />

      {/* ── Formula — centered, responsive size, subtle inner shadow and glow ──────────────── */}
      <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-center text-foreground overflow-x-auto custom-scrollbar py-4 bg-slate-950/40 rounded-xl border border-white/5 shadow-inner">
        {renderFormula()}
      </div>

      {/* ── Short explanation (if exists) ────────────────── */}
      {hasExplanation && (
        <p className="mt-4 text-xs sm:text-[13.5px] text-slate-400 leading-relaxed font-light">
          {data.explanation}
        </p>
      )}

      {/* ── Variables responsive grid ────────────────── */}
      {hasVariables && (
        <div className="space-y-2.5 mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Variables
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.variables.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-950/20 border border-slate-900/40 hover:border-slate-800 transition-colors"
              >
                <span className="font-mono text-sm font-bold text-violet-400 shrink-0">
                  {v.symbol}
                </span>
                <span className="text-slate-600 text-xs">→</span>
                <span className="text-xs text-slate-300 truncate" title={v.meaning}>
                  {v.meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ────────────────── */}
      <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => {
            setInlineRagContent(parentContent || body);
            setShowInlineFormulaLab(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-400 text-[11px] font-bold text-white transition-all active:scale-95 shadow-sm shadow-violet-900/20"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Open Formula Lab</span>
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setActiveFormulaId(data.formula);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visualize</span>
        </button>

        <button
          onClick={() => {
            setActiveFormulaId(data.formula);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Practice</span>
        </button>
      </div>
    </div>
  );
}
