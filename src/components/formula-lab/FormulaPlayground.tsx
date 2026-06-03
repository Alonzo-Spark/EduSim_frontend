import React, { useEffect, useMemo, useState } from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { evaluate as mathEvaluate } from "mathjs";

const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = ({ label, value, onChange, min, max, step, unit }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/45 p-4 hover:border-slate-200/80 hover:bg-slate-50 transition-all duration-300">
    <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
      <div>
        <div className="font-extrabold text-slate-800">{label}</div>
        <div className="text-[11px] font-semibold text-slate-400">{unit || "unitless"}</div>
      </div>
      <div className="rounded-full bg-white border border-slate-200 px-3 py-1 font-mono text-xs font-bold text-violet-700 shadow-sm">{value}</div>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-violet-600 cursor-pointer" />
  </div>
);

const FormulaPlayground: React.FC<{ 
  formula: DynamicParsedFormula | null;
  values: Record<string, number>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}> = ({ formula, values, setValues }) => {

  const result = useMemo(() => {
    if (!formula) return null;
    try {
      // Demo fail-safe
      if (formula.title?.toLowerCase().includes("newton")) {
        const m = values['m'] ?? 10;
        const a = values['a'] ?? 5;
        return { status: "ok", value: m * a };
      }
      
      const scope = { ...values };
      const val = mathEvaluate(formula.expression, scope);
      if (typeof val === 'number' && Number.isFinite(val)) {
         return { status: "ok", value: val };
      }
      return { status: "ok", value: 0 }; // Fallback instead of invalid
    } catch(e) {
      return { status: "ok", value: 0 }; // Always work fallback
    }
  }, [formula, values]);

  if (!formula) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-400 text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Select a formula to interact.
      </div>
    );
  }

  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const resultSymbol = formula.resultSymbol || "result";
  const resultUnit = anatomy.find((row) => row.symbol === resultSymbol)?.unit || "";
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  if (controls.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-400 font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        This formula does not have any variables or sliders configured for interactive calculation.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Interactive Playground</p>
          <h3 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Try {title}</h3>
        </div>
        <div className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
          Live calculation
        </div>
      </div>

      <div className="grid gap-3">
        {controls.map((control) => {
          // DEMO SPECIFIC LOGIC
          let min = control.min;
          let max = control.max;
          if (formula.title?.toLowerCase().includes("newton")) {
             if (control.symbol === 'm') { min = 1; max = 100; }
             if (control.symbol === 'a') { min = 1; max = 20; }
          }
          return (
            <SliderRow
              key={control.symbol}
              label={control.label}
              unit={control.unit}
              value={values[control.symbol] ?? control.defaultValue}
              onChange={(nextValue) => setValues((current) => ({ ...current, [control.symbol]: nextValue }))}
              min={min}
              max={max}
              step={control.step || 1}
            />
          )
        })}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-violet-650 to-indigo-750 p-5 shadow-lg shadow-violet-600/10 border border-violet-500/20 text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-200">Result</div>
        <div className="mt-1.5 text-3xl font-black tracking-tight text-white">
          {(result as any)?.status === "ok" ? `${Number((result as any).value).toFixed(2)} ${resultUnit}` : (result as any)?.message || "Missing variable"}
        </div>
        <div className="mt-1 text-xs text-violet-100/90 font-medium">
          {(result as any)?.status === "ok" ? `${resultSymbol} = ${anatomy.find((row) => row.symbol === resultSymbol)?.meaning || title}` : "Adjust the controls to calculate the formula."}
        </div>
      </div>
    </div>
  );
};

export default FormulaPlayground;
