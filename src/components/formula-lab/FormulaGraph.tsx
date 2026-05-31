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

  if (!formula) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-400 text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Graph will appear when a formula is selected.
      </div>
    );
  }

  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const isNewton = formula.title?.toLowerCase().includes("newton");
  const xVar = isNewton ? controls.find(c => c.symbol === 'a') : controls[0];
  const resultSymbol = formula.resultSymbol || "result";
  const xLabel = xVar ? (anatomy.find(a => a.symbol === xVar?.symbol)?.meaning || xVar?.symbol) : "x";
  const yLabel = anatomy.find(a => a.symbol === resultSymbol)?.meaning || resultSymbol;
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-400 font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        This formula does not have enough variables or data configured to generate a live graph.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Live Graph</p>
          <h3 className="mt-1 text-lg font-black text-slate-800 tracking-tight">{yLabel} vs {xLabel}</h3>
        </div>
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
          {title}
        </div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
            <XAxis dataKey="x" stroke="rgba(15,23,42,0.4)" tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
            <YAxis stroke="rgba(15,23,42,0.4)" tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
            <Tooltip contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.98)", border: "1px solid rgba(241, 245, 249, 1)", borderRadius: 16, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }} labelStyle={{ fontWeight: "bold", color: "#1e293b" }} itemStyle={{ color: "#7c3aed" }} />
            <Line type="monotone" dataKey="y" stroke="#7c3aed" strokeWidth={3.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FormulaGraph;
