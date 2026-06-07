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
}> = ({ label, value, onChange, min, max, step, unit }) => {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleTextChange = (valStr: string) => {
    setTempValue(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/45 p-4 hover:border-slate-200/80 hover:bg-slate-50 transition-all duration-300">
      <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
        <div>
          <div className="font-extrabold text-slate-800">{label}</div>
          <div className="text-[11px] font-semibold text-slate-400">{unit || "unitless"}</div>
        </div>
        <input
          type="text"
          value={tempValue}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-40 rounded-xl bg-white border border-slate-200 px-3 py-1 text-right font-mono text-xs font-bold text-violet-750 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isNaN(value) ? min : value}
        onChange={(e) => {
          const val = Number(e.target.value);
          onChange(val);
          setTempValue(val.toString());
        }}
        className="w-full accent-violet-600 cursor-pointer"
      />
    </div>
  );
};

const FormulaPlayground: React.FC<{ 
  formula: DynamicParsedFormula | null;
  values: Record<string, number>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}> = ({ formula, values, setValues }) => {
  const controls = useMemo(() => Array.isArray(formula?.controls) ? formula.controls : [], [formula]);
  const symbols = useMemo(() => controls.map(c => c.symbol), [controls]);

  // Track which symbol to solve for
  const defaultTarget = formula?.resultSymbol || symbols[0] || "";
  const [targetSymbol, setTargetSymbol] = useState<string>("");

  useEffect(() => {
    if (symbols.includes(defaultTarget)) {
      setTargetSymbol(defaultTarget);
    } else if (symbols.length > 0) {
      setTargetSymbol(symbols[0]);
    }
  }, [defaultTarget, symbols]);

  const result = useMemo<{ status: "ok"; value: number } | { status: "error"; message: string } | null>(() => {
    if (!formula || !targetSymbol) return null;
    try {
      let expr = formula.expression || formula.formula || "";
      const formulaStr = (formula.formula || formula.expression || "").replace(/\s+/g, "");
      const scope = { ...values };
      delete scope[targetSymbol];

      if (formula.derived_expressions && formula.derived_expressions[targetSymbol]) {
        expr = formula.derived_expressions[targetSymbol];
        const val = mathEvaluate(expr, scope);
        if (typeof val === 'number' && Number.isFinite(val)) {
          return { status: "ok", value: val };
        }
      } else if (formula.id === "newton-second-law" || formulaStr === "F=ma" || formulaStr === "F=m*a" || formulaStr === "F=m\\timesa") {
        // Fallback F = m * a
        const m = scope.m ?? 10;
        const a = scope.a ?? 5;
        const F = scope.F ?? 50;
        if (targetSymbol === "F") {
          return { status: "ok", value: m * a };
        } else if (targetSymbol === "m") {
          if (a === 0) throw new Error("Acceleration cannot be zero.");
          return { status: "ok", value: F / a };
        } else if (targetSymbol === "a") {
          if (m === 0) throw new Error("Mass cannot be zero.");
          return { status: "ok", value: F / m };
        }
      } else {
        // Dynamic string parser fallback
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

        const val = mathEvaluate(expr, scope);
        if (typeof val === 'number' && Number.isFinite(val)) {
          return { status: "ok", value: val };
        }
      }
      return { status: "ok", value: 0 };
    } catch(e: any) {
      return { status: "error", message: e.message || "Calculation error" };
    }
  }, [formula, values, targetSymbol]);

  // Sync calculated result value back to parent values state
  useEffect(() => {
    if (result && result.status === "ok" && "value" in result && targetSymbol) {
      const valNum = result.value;
      if (valNum !== undefined) {
        const roundedVal = Number(valNum.toPrecision(6));
        if (values[targetSymbol] !== roundedVal) {
          setValues((current) => ({ ...current, [targetSymbol]: roundedVal }));
        }
      }
    }
  }, [result, targetSymbol, setValues, values]);

  if (!formula) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-400 text-center font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        Select a formula to interact.
      </div>
    );
  }

  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const resultUnit = anatomy.find((row) => row.symbol === targetSymbol)?.unit || "";
  const title = formula.title || formula.displayFormula || formula.formula || formula.raw || "Unnamed Formula";

  // Filter out targetSymbol from the inputs
  const inputControls = controls.filter((control) => control.symbol !== targetSymbol);

  if (inputControls.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-400 font-medium shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        This formula does not have any variables or sliders configured for interactive calculation.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Interactive Playground</p>
          <h3 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">Try {title}</h3>
        </div>
        <div className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700 w-fit self-start">
          Live calculation
        </div>
      </div>

      {/* Target variable selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Solve For</label>
        <div className="flex flex-wrap gap-2">
          {controls.map((c) => (
            <button
              key={c.symbol}
              type="button"
              onClick={() => setTargetSymbol(c.symbol)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                targetSymbol === c.symbol
                  ? "bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-650/15"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {c.label || c.symbol} ({c.symbol})
            </button>
          ))}
        </div>
      </div>

      {/* Sliders for remaining variables */}
      <div className="grid gap-3">
        {inputControls.map((control) => {
          let min = control.min;
          let max = control.max;
          let step = control.step || 1;
          
          const defVal = values[control.symbol] ?? control.defaultValue;
          if (min === 1 && max === 100 && (defVal < 0.1 || defVal > 1000)) {
            if (defVal > 0) {
              min = defVal / 10;
              max = defVal * 10;
              step = (max - min) / 100;
            } else if (defVal < 0) {
              min = defVal * 10;
              max = defVal / 10;
              step = (max - min) / 100;
            }
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
              step={step}
            />
          )
        })}
      </div>

      {/* Result Display Card */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-violet-650 to-indigo-750 p-5 shadow-lg shadow-violet-600/10 border border-violet-500/20 text-white relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl" />
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-violet-200">Result ({targetSymbol})</div>
        <div className="mt-1.5 text-3xl font-black tracking-tight text-white">
          {result?.status === "ok" && "value" in result && result.value !== undefined ? (
            Math.abs(result.value) >= 10000 || (Math.abs(result.value) < 0.001 && result.value !== 0)
              ? `${Number(result.value).toExponential(4)} ${resultUnit}`
              : `${Number(result.value).toFixed(2)} ${resultUnit}`
          ) : result?.status === "error" ? (
            result.message
          ) : (
            "Adjust the controls to calculate"
          )}
        </div>
        <div className="mt-1 text-xs text-violet-100/90 font-medium">
          {result?.status === "ok" ? `${targetSymbol} = ${anatomy.find((row) => row.symbol === targetSymbol)?.meaning || title}` : "Adjust the controls to calculate the formula."}
        </div>
      </div>
    </div>
  );
};

export default FormulaPlayground;
