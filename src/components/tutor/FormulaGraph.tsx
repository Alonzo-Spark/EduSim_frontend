import React, { useMemo, useState, useEffect } from "react";
import { evaluate as mathEvaluate } from "mathjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label
} from "recharts";

interface Props {
  formulaDef?: any;
}

export default function FormulaGraph({ formulaDef }: Props) {
  // Track values for constant variables
  const [constants, setConstants] = useState<Record<string, number>>({});

  // Normalize variables and symbols
  const symbols = useMemo(() => {
    if (!formulaDef) return [];
    if (Array.isArray(formulaDef.controls)) {
      return formulaDef.controls.map((c: any) => c.symbol);
    }
    if (formulaDef.variables && typeof formulaDef.variables === "object" && !Array.isArray(formulaDef.variables)) {
      return Object.keys(formulaDef.variables);
    }
    if (Array.isArray(formulaDef.variables)) {
      return formulaDef.variables.map((v: any) => v.symbol);
    }
    return [];
  }, [formulaDef]);

  const variables = useMemo(() => {
    if (!formulaDef) return {};
    if (Array.isArray(formulaDef.controls)) {
      const mapped: Record<string, string> = {};
      formulaDef.controls.forEach((c: any) => {
        mapped[c.symbol] = c.label || c.symbol;
      });
      return mapped;
    }
    if (Array.isArray(formulaDef.variables)) {
      const mapped: Record<string, string> = {};
      formulaDef.variables.forEach((v: any) => {
        mapped[v.symbol] = v.meaning || v.label || v.symbol;
      });
      return mapped;
    }
    return formulaDef.variables || {};
  }, [formulaDef]);

  // Identify axes
  const yAxisSymbol = formulaDef?.resultSymbol || symbols[0] || "y";
  const inputControls = symbols.filter((sym: string) => sym !== yAxisSymbol);
  const xAxisSymbol = inputControls[inputControls.length - 1] || "x";
  const constantControls = inputControls.filter((sym: string) => sym !== xAxisSymbol);

  // Initialize constants
  useEffect(() => {
    const initial: Record<string, number> = {};
    constantControls.forEach((sym: string) => {
      const control = Array.isArray(formulaDef?.controls)
        ? formulaDef.controls.find((c: any) => c.symbol === sym)
        : null;
      initial[sym] = control?.defaultValue ?? 5;
    });
    setConstants(initial);
  }, [constantControls, formulaDef]);

  const data = useMemo(() => {
    if (!formulaDef || symbols.length === 0) return [];
    
    // Simplify/normalize formula expression to RHS expression
    let expr = formulaDef.expression || formulaDef.formula || "";
    if (formulaDef.derived_expressions && formulaDef.derived_expressions[yAxisSymbol]) {
      expr = formulaDef.derived_expressions[yAxisSymbol];
    } else {
      let clean = expr.replace(/[\$]/g, "");
      clean = clean
        .replace(/\\Delta\s*\{?([a-zA-Z])\}?/g, "Delta_$1")
        .replace(/Delta\s*([a-zA-Z])/g, "Delta_$1")
        .replace(/\s/g, "");
      const parts = clean.split("=");
      expr = parts[1] || parts[0];
      expr = expr
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
        .replace(/\\sqrt\s*\{([^}]+)\}/g, "sqrt($1)")
        .replace(/\\sqrt/g, "sqrt")
        .replace(/\\sin/g, "sin")
        .replace(/\\cos/g, "cos")
        .replace(/\\tan/g, "tan")
        .replace(/\\theta/g, "theta")
        .replace(/\\cdot/g, "*")
        .replace(/\\times/g, "*")
        .replace(/\\/g, "")
        .replace(/\^/g, "**")
        .replace(/\{/g, "(")
        .replace(/\}/g, ")");
    }

    // Determine bounds for X axis variable
    const xControl = Array.isArray(formulaDef.controls)
      ? formulaDef.controls.find((c: any) => c.symbol === xAxisSymbol)
      : null;
    const min = xControl?.min !== undefined ? xControl.min : 0;
    const max = xControl?.max !== undefined ? xControl.max : 20;
    const step = (max - min) / 50 || 1;

    const dataPoints = [];
    for (let x = min; x <= max; x += step) {
      try {
        const scope = { ...constants, [xAxisSymbol]: x };
        const y = mathEvaluate(expr, scope);
        if (typeof y === "number" && Number.isFinite(y)) {
          dataPoints.push({
            x: Number(x.toPrecision(5)),
            y: Number(y.toPrecision(5))
          });
        }
      } catch (e) {
        // ignore mathjs evaluation errors
      }
    }
    return dataPoints;
  }, [formulaDef, symbols, xAxisSymbol, yAxisSymbol, constants]);

  if (!formulaDef || symbols.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No graph available for this formula.
      </div>
    );
  }

  const yAxisLabel = variables[yAxisSymbol] || yAxisSymbol;
  const xAxisLabel = variables[xAxisSymbol] || xAxisSymbol;

  const handleConstantChange = (sym: string, val: number) => {
    setConstants(prev => ({ ...prev, [sym]: val }));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Plotting: <strong className="text-foreground">{yAxisLabel} ({yAxisSymbol})</strong> vs <strong className="text-foreground">{xAxisLabel} ({xAxisSymbol})</strong>
        </div>
        
        {/* Dynamic Constant Sliders */}
        {constantControls.length > 0 && (
          <div className="flex flex-wrap gap-4 items-center">
            {constantControls.map((sym: string) => {
              const control = Array.isArray(formulaDef.controls)
                ? formulaDef.controls.find((c: any) => c.symbol === sym)
                : null;
              const min = control?.min ?? 1;
              const max = control?.max ?? 100;
              const step = control?.step ?? 1;
              const val = constants[sym] ?? control?.defaultValue ?? 5;
              
              return (
                <div key={sym} className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {variables[sym] || sym}: {val}
                  </label>
                  <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step}
                    value={val} 
                    onChange={(e) => handleConstantChange(sym, Number(e.target.value))}
                    className="w-20 accent-violet-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full min-h-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Insufficient dynamic parameters to render graph.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
              <XAxis dataKey="x" stroke="rgba(15,23,42,0.4)" tickLine={false} tick={{ fontSize: 10, fontWeight: 550 }}>
                <Label value={`${xAxisLabel} (${xAxisSymbol})`} offset={-10} position="insideBottom" fill="rgba(15,23,42,0.5)" style={{ fontSize: 10, fontWeight: "bold" }} />
              </XAxis>
              <YAxis stroke="rgba(15,23,42,0.4)" tickLine={false} tick={{ fontSize: 10, fontWeight: 550 }}>
                <Label value={`${yAxisLabel} (${yAxisSymbol})`} angle={-90} position="insideLeft" fill="rgba(15,23,42,0.5)" style={{ textAnchor: 'middle', fontSize: 10, fontWeight: "bold" }} />
              </YAxis>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: '1px solid rgba(241, 245, 249, 1)', borderRadius: '12px', boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                itemStyle={{ color: '#7c3aed', fontSize: 11, fontWeight: "bold" }}
                labelStyle={{ fontWeight: "bold", fontSize: 10, color: "#1e293b" }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

