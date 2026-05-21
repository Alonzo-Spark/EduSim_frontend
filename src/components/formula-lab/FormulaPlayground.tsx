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
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <div>
        <div className="font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{unit || "unitless"}</div>
      </div>
      <div className="rounded-full bg-black/10 px-3 py-1 font-mono text-sm text-foreground">{value}</div>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-violet-500" />
  </div>
);

const FormulaPlayground: React.FC<{ formula: DynamicParsedFormula | null }> = ({ formula }) => {
  const initialValues = useMemo(() => {
    if (!formula) return {} as Record<string, number>;
    return (Array.isArray(formula.controls) ? formula.controls : []).reduce<Record<string, number>>((acc, control) => {
      acc[control.symbol] = control.defaultValue;
      return acc;
    }, {});
  }, [formula]);

  const [values, setValues] = useState<Record<string, number>>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const result = useMemo(() => {
    if (!formula) return null;
    try {
      const scope = { ...values };
      const val = mathEvaluate(formula.expression, scope);
      if (typeof val === 'number' && Number.isFinite(val)) {
         return { status: "ok", value: val };
      }
      return { status: "invalid", message: "Cannot evaluate" };
    } catch(e) {
      return { status: "invalid", message: "Invalid evaluation" };
    }
  }, [formula, values]);

  if (!formula) return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">Select a formula to interact.</div>;

  const anatomy = Array.isArray(formula.anatomy) ? formula.anatomy : [];
  const controls = Array.isArray(formula.controls) ? formula.controls : [];
  const resultSymbol = formula.resultSymbol || "result";
  const resultUnit = anatomy.find((row) => row.symbol === resultSymbol)?.unit || "";
  const title = formula.title || formula.formula || formula.raw || "Unnamed Formula";

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Interactive Playground</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Try {title}</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Live calculation</div>
      </div>

      <div className="grid gap-3">
        {controls.length > 0 ? (
          controls.map((control) => (
            <SliderRow
              key={control.symbol}
              label={control.label}
              unit={control.unit}
              value={values[control.symbol] ?? control.defaultValue}
              onChange={(nextValue) => setValues((current) => ({ ...current, [control.symbol]: nextValue }))}
              min={control.min}
              max={control.max}
              step={control.step}
            />
          ))
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            Unable to generate interactive controls.
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/5 to-cyan-500/10 p-5 shadow-inner">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Result</div>
        <div className="mt-2 text-2xl font-bold text-foreground">
          {result?.status === "ok" ? `${Number(result.value).toFixed(2)} ${resultUnit}` : result?.message || "Missing variable"}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {result?.status === "ok" ? `${resultSymbol} = ${anatomy.find((row) => row.symbol === resultSymbol)?.meaning || title}` : "Adjust the controls to calculate the formula."}
        </div>
      </div>
    </div>
  );
};

export default FormulaPlayground;
