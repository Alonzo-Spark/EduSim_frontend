import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { BlockMath } from "react-katex";

function cleanAndTruncate(text: string, maxWords: number): string {
  if (!text) return "";
  let cleaned = text.replace(/#+\s*/g, "");
  cleaned = cleaned.replace(/\*\*|__/g, "");
  cleaned = cleaned.replace(/\*|_/g, "");
  const words = cleaned.trim().split(/\s+/);
  if (words.length <= maxWords) return cleaned;
  return words.slice(0, maxWords).join(" ") + "...";
}

const FormulaAnatomy: React.FC<{
  formula: DynamicParsedFormula | null;
  mode?: "overview" | "variables";
}> = ({ formula, mode }) => {
  if (!formula) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Select a formula to see anatomy.
      </div>
    );
  }

  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";
  const latex = formula.latex || formula.formula || "";
  const rawDescription = formula.description || "No description available.";
  const description = cleanAndTruncate(rawDescription, 30);
  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
      {(!mode || mode === "overview") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Selected Formula</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{title}</h3>
            </div>
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Dynamic
            </span>
          </div>
          <div className="rounded-3xl border border-border bg-secondary px-4 py-5 text-center">
            {latex ? <BlockMath math={latex} /> : <p className="text-sm text-muted-foreground">No formula preview available.</p>}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      )}

      {(!mode || mode === "variables") && (
        <div>
          <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground mb-4">Formula Variables</h4>
          <div className="overflow-hidden rounded-3xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Meaning</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody>
                {anatomy.length > 0 ? (
                  anatomy.map((row, index) => (
                    <tr
                      key={row.symbol}
                      className={index % 2 === 0 ? "bg-card" : "bg-secondary/40"}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-primary">{row.symbol}</td>
                      <td className="px-4 py-3 text-foreground">{row.meaning}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.unit || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No variable mappings available for this formula.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaAnatomy;
