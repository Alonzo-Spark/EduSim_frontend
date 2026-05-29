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
      } catch (e) {
        // ignore
      }
    }
    return points;
  }, [formula]);

  if (!formula) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
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
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          This formula does not have enough variables or data configured to generate a live graph.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Live Graph</p>
          <h3 className="mt-2 text-xl font-bold text-foreground">{yLabel} vs {xLabel}</h3>
        </div>
        <div className="text-xs text-muted-foreground font-medium">{title}</div>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            {/* Grid lines use the border color token via hex fallback */}
            <CartesianGrid strokeDasharray="3 3" stroke="#CCE6FF" />
            <XAxis
              dataKey="x"
              stroke="#64748B"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #CCE6FF",
                borderRadius: 16,
                boxShadow: "0 4px 20px rgba(112,181,255,0.12)",
                color: "#0F172A",
                fontSize: 12,
              }}
            />
            {/* Line uses the primary color token value */}
            <Line
              type="monotone"
              dataKey="y"
              stroke="#70B5FF"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#70B5FF", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FormulaGraph;
