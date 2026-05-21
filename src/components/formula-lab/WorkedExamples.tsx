import React from "react";
import { ParsedFormula } from "@/utils/FormulaExtractor";
import { getFormulaLabProfile, solveFormulaLab } from "@/data/formulaLabProfiles";

const WorkedExamples: React.FC<{ formula: ParsedFormula | null }> = ({ formula }) => {
  const profile = formula ? getFormulaLabProfile(formula.profileId || formula.id) : undefined;

  if (!formula || !profile) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Worked Examples</p>
        <h3 className="mt-2 text-xl font-bold">Step-by-step practice</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {profile.examples.map((example) => {
          const solution = solveFormulaLab(profile.id, example.given);
          return (
            <div key={example.title} className="rounded-3xl border border-white/10 bg-black/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold">{example.title}</h4>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Find {example.find}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {Object.entries(example.given).map(([symbol, value]) => (
                  <div key={symbol} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                    <span className="font-mono font-semibold">{symbol}</span>
                    <span className="text-muted-foreground">{String(value)} {profile.anatomy.find((row) => row.symbol === symbol)?.unit || ""}</span>
                  </div>
                ))}
              </div>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-foreground/90">
                {example.steps.map((step) => (
                  <li key={step} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">{step}</li>
                ))}
              </ol>
              <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm">
                <div className="font-bold">Answer</div>
                <div className="mt-1 text-muted-foreground">
                  {solution.status === "ok" ? `${solution.value?.toFixed(2)} ${profile.anatomy.find((row) => row.symbol === solution.symbol)?.unit || ""}` : solution.message || "Missing variable"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkedExamples;
