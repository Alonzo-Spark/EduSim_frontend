import React, { useMemo } from "react";
import { ParsedFormula } from "@/utils/FormulaExtractor";
import { getFormulaLabProfile } from "@/data/formulaLabProfiles";

const AIInsightPanel: React.FC<{ formula: ParsedFormula | null }> = ({ formula }) => {
  const profile = formula ? getFormulaLabProfile(formula.profileId || formula.id) : undefined;

  const insights = useMemo(() => {
    if (!profile) return [] as string[];
    const defaults = profile.controls.reduce<Record<string, number>>((acc, control) => {
      acc[control.symbol] = control.defaultValue;
      return acc;
    }, {});
    return profile.insights(defaults).slice(0, 4);
  }, [profile]);

  if (!formula || !profile) return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">AI insights will appear here once a formula is selected.</div>;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">AI Insights</p>
        <h3 className="mt-2 text-xl font-bold">Why this formula matters</h3>
      </div>
      <div className="grid gap-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-foreground/90">
            {insight}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightPanel;
