import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { BlockMath } from "@/components/math/Katex";

function cleanAndTruncate(text: string, maxWords: number): string {
  if (!text) return "";
  // Strip Markdown headings like "### " or "## "
  let cleaned = text.replace(/#+\s*/g, "");
  // Strip bold/italic symbols like "**" or "*"
  cleaned = cleaned.replace(/\*\*|__/g, "");
  cleaned = cleaned.replace(/\*|_/g, "");
  // Split into words, limit, and join
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
      <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-400 text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
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
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      {(!mode || mode === "overview") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Selected Formula</p>
              <h3 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
            </div>
            <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
              Interactive
            </span>
          </div>
          <div className="rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-500/[0.02] to-indigo-500/[0.02] px-4 py-6 text-center text-violet-850 shadow-inner">
            {latex ? <BlockMath math={latex} /> : <p className="text-sm text-slate-400 font-medium">No formula preview available.</p>}
          </div>
          <p className="text-sm leading-6 text-slate-650 font-normal">{description}</p>
        </div>
      )}

      {(!mode || mode === "variables") && (
        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Formula Variables</h4>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Meaning</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anatomy.length > 0 ? (
                  anatomy.map((row, index) => (
                    <tr key={row.symbol} className={index % 2 === 0 ? "bg-slate-50/20" : "bg-transparent"}>
                      <td className="px-4 py-3 font-mono font-extrabold text-violet-600">{row.symbol}</td>
                      <td className="px-4 py-3 text-slate-650 font-normal">{row.meaning}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{row.unit || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-medium">
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
