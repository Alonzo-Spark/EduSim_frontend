import React from "react";
import { ParsedFormula } from "@/utils/FormulaExtractor";
import { BlockMath } from "react-katex";
import { getFormulaLabProfile } from "@/data/formulaLabProfiles";

const FormulaAnatomy: React.FC<{ formula: ParsedFormula | null }> = ({ formula }) => {
  const profile = formula ? getFormulaLabProfile(formula.profileId || formula.id) : undefined;

  if (!formula || !profile) {
    return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">Select a formula to see anatomy.</div>;
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Selected Formula</p>
            <h3 className="mt-2 text-2xl font-extrabold tracking-tight">{profile.title}</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            {profile.category}
          </span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-5 text-center">
          <BlockMath math={profile.latex} />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{profile.description}</p>
      </div>

      <div>
        <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">Formula Anatomy</h4>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Meaning</th>
                <th className="px-4 py-3">Unit</th>
              </tr>
            </thead>
            <tbody>
              {profile.anatomy.map((row, index) => (
                <tr key={row.symbol} className={index % 2 === 0 ? "bg-white/3" : "bg-transparent"}>
                  <td className="px-4 py-3 font-mono font-semibold">{row.symbol}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.meaning}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.unit || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormulaAnatomy;
