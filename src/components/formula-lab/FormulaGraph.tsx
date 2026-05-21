import React, { useMemo } from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { evaluate as mathEvaluate } from "mathjs";

const FormulaGraph: React.FC<{ 
  formula: DynamicParsedFormula | null;
  values: Record<string, number>;
}> = ({ formula, values }) => {
  const data = useMemo(() => {
    if (!formula) return [] as Array<{ x: number; y: number }>;
    const controls = Array.isArray(formula.controls) ? formula.controls : [];
    const xVar = controls[controls.length - 1];
    if (!xVar) return [];

    const points: Array<{ x: number; y: number }> = [];
    const isNewton = formula.title?.toLowerCase().includes("newton");

    if (isNewton) {
        // DEMO SPECIFIC LOGIC for F = ma
        // x-axis: Acceleration, y-axis: Force, keeping mass constant based on slider.
        const m = values['m'] ?? 10;
        for (let a = 0; a <= 20; a += 1) {
            points.push({ x: a, y: m * a });
        }
        return points;
    }

    const min = xVar.min || 0;
    const max = xVar.max || 20;
    const step = (max - min) / 50 || 1;
    for (let x = min; x <= max; x += step) {
        try {
            const scope = { ...values, [xVar.symbol]: x };
            const y = mathEvaluate(formula.expression, scope);
            if (typeof y === 'number' && Number.isFinite(y)) {
                points.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
            }
        } catch(e) {
            // ignore
        }
    }
    return points;
  }, [formula]);

  if (!formula) return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">Graph will appear when a formula is selected.</div>;

  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const isNewton = formula.title?.toLowerCase().includes("newton");
  const xVar = isNewton ? controls.find(c => c.symbol === 'a') : controls[0];
  const resultSymbol = formula.resultSymbol || "result";
  const xLabel = xVar ? (anatomy.find(a => a.symbol === xVar?.symbol)?.meaning || xVar?.symbol) : "x";
  const yLabel = anatomy.find(a => a.symbol === resultSymbol)?.meaning || resultSymbol;
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  if (data.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Live Graph</p>
          <h3 className="mt-2 text-xl font-bold">{yLabel} vs {xLabel}</h3>
        </div>
        <div className="text-xs text-muted-foreground">{title}</div>
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
