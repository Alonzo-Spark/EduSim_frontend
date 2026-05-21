import React, { useMemo } from "react";
import { ParsedFormula } from "@/utils/FormulaExtractor";
import { buildFormulaGraph, getFormulaLabProfile } from "@/data/formulaLabProfiles";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const FormulaGraph: React.FC<{ formula: ParsedFormula | null }> = ({ formula }) => {
  const profile = formula ? getFormulaLabProfile(formula.profileId || formula.id) : undefined;

  const data = useMemo(() => {
    if (!profile) return [] as Array<{ x: number; y: number }>;
    const values = profile.controls.reduce<Record<string, number>>((acc, control) => {
      acc[control.symbol] = control.defaultValue;
      return acc;
    }, {});
    return buildFormulaGraph(profile.id, values);
  }, [profile]);

  if (!formula || !profile) return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">Graph will appear when a formula is selected.</div>;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Live Graph</p>
          <h3 className="mt-2 text-xl font-bold">{profile.graph.yLabel} vs {profile.graph.xLabel}</h3>
        </div>
        <div className="text-xs text-muted-foreground">{profile.title}</div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="x" stroke="rgba(255,255,255,0.5)" tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Line type="monotone" dataKey="y" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FormulaGraph;
