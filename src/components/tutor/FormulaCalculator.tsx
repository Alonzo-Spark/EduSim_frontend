import React, { useState, useEffect, useMemo } from "react";
import { evaluate as mathEvaluate } from "mathjs";

interface Props {
  formulaDef?: any;
}

export default function FormulaCalculator({ formulaDef }: Props) {
  if (!formulaDef) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p>No calculator available for this formula definition.</p>
      </div>
    );
  }

  // Extract variables dynamically from formulaDef (handles static/dynamic formats)
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

  const unitMap = useMemo(() => {
    if (!formulaDef) return {};
    if (Array.isArray(formulaDef.controls)) {
      const mapped: Record<string, string> = {};
      formulaDef.controls.forEach((c: any) => {
        mapped[c.symbol] = c.unit || "";
      });
      return mapped;
    }
    if (Array.isArray(formulaDef.variables)) {
      const mapped: Record<string, string> = {};
      formulaDef.variables.forEach((v: any) => {
        mapped[v.symbol] = v.unit || "";
      });
      return mapped;
    }
    return formulaDef.unitMap || {};
  }, [formulaDef]);

  // Default target is the first variable (typically LHS of equation or resultSymbol)
  const defaultTarget = formulaDef.resultSymbol || symbols[0] || "";
  const [targetSymbol, setTargetSymbol] = useState<string>("");

  useEffect(() => {
    if (symbols.includes(defaultTarget)) {
      setTargetSymbol(defaultTarget);
    } else if (symbols.length > 0) {
      setTargetSymbol(symbols[0]);
    }
  }, [defaultTarget, symbols]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize values
  useEffect(() => {
    if (!targetSymbol) return;
    const initialValues: Record<string, string> = {};
    symbols.forEach((sym: string) => {
      if (sym !== targetSymbol) {
        // Set some sensible default values based on the formula
        const control = Array.isArray(formulaDef?.controls)
          ? formulaDef.controls.find((c: any) => c.symbol === sym)
          : null;
        
        if (control && control.defaultValue !== undefined) {
          initialValues[sym] = String(control.defaultValue);
        } else {
          const formulaStr = (formulaDef.formula || formulaDef.expression || "").toLowerCase();
          if (formulaDef.id === "newton-second-law" || formulaStr === "f=ma") {
            initialValues[sym] = sym === "m" ? "10" : "9.8";
          } else if (formulaDef.id === "ohms-law" || formulaStr === "v=ir") {
            initialValues[sym] = sym === "I" ? "2" : "10";
          } else if (formulaDef.id === "kinetic-energy" || formulaStr.includes("ke")) {
            initialValues[sym] = sym === "m" ? "5" : "4";
          } else {
            initialValues[sym] = "10";
          }
        }
      }
    });
    setValues(initialValues);
    setErrorMsg(null);
  }, [targetSymbol, formulaDef, symbols]);

  // Recalculate dynamically using mathjs
  useEffect(() => {
    if (!targetSymbol) return;
    setErrorMsg(null);
    const inputs: Record<string, number> = {};
    let hasEmpty = false;

    for (const sym of symbols) {
      if (sym !== targetSymbol) {
        const valStr = values[sym];
        if (!valStr || valStr.trim() === "") {
          hasEmpty = true;
          break;
        }
        const valNum = parseFloat(valStr);
        if (isNaN(valNum)) {
          setErrorMsg("Please enter valid numeric values.");
          return;
        }
        inputs[sym] = valNum;
      }
    }

    if (hasEmpty) {
      setResult(null);
      return;
    }

    try {
      let calculated = 0;
      const formulaStr = (formulaDef.formula || formulaDef.expression || "").replace(/\s+/g, "");

      if (formulaDef.derived_expressions && formulaDef.derived_expressions[targetSymbol]) {
        // Dynamic derived expression from SymPy solver
        const expr = formulaDef.derived_expressions[targetSymbol];
        calculated = mathEvaluate(expr, inputs);
      } else if (formulaDef.id === "newton-second-law" || formulaStr === "F=ma" || formulaStr === "F=m*a" || formulaStr === "F=m\\timesa") {
        // Fallback F = m * a
        if (targetSymbol === "F") {
          calculated = inputs.m * inputs.a;
        } else if (targetSymbol === "m") {
          if (inputs.a === 0) throw new Error("Acceleration cannot be zero.");
          calculated = inputs.F / inputs.a;
        } else if (targetSymbol === "a") {
          if (inputs.m === 0) throw new Error("Mass cannot be zero.");
          calculated = inputs.F / inputs.m;
        }
      } else if (formulaDef.id === "ohms-law" || formulaStr === "V=IR" || formulaStr === "V=I*R" || formulaStr === "V=I\\timesR") {
        // Fallback V = I * R
        if (targetSymbol === "V") {
          calculated = inputs.I * inputs.R;
        } else if (targetSymbol === "I") {
          if (inputs.R === 0) throw new Error("Resistance cannot be zero.");
          calculated = inputs.V / inputs.R;
        } else if (targetSymbol === "R") {
          if (inputs.I === 0) throw new Error("Current cannot be zero.");
          calculated = inputs.V / inputs.I;
        }
      } else if (formulaDef.id === "kinetic-energy" || formulaStr.includes("KE=1/2mv^2") || formulaStr.includes("KE=\\frac{1}{2}mv^2")) {
        // Fallback KE = 0.5 * m * v^2
        if (targetSymbol === "KE") {
          calculated = 0.5 * inputs.m * Math.pow(inputs.v, 2);
        } else if (targetSymbol === "m") {
          if (inputs.v === 0) throw new Error("Velocity cannot be zero.");
          calculated = (2 * inputs.KE) / Math.pow(inputs.v, 2);
        } else if (targetSymbol === "v") {
          if (inputs.m === 0) throw new Error("Mass cannot be zero.");
          const val = (2 * inputs.KE) / inputs.m;
          if (val < 0) throw new Error("Cannot take square root of negative value.");
          calculated = Math.sqrt(val);
        }
      } else {
        // Generic Mathjs string parser fallback
        let expr = formulaDef.expression || formulaDef.formula || "";
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

        calculated = mathEvaluate(expr, inputs);
      }

      if (typeof calculated !== "number" || !Number.isFinite(calculated)) {
        throw new Error("Result is not a finite number.");
      }

      setResult(calculated);
    } catch (e: any) {
      setErrorMsg(e.message || "Calculation error");
      setResult(null);
    }
  }, [values, targetSymbol, formulaDef, symbols]);

  const handleInputChange = (sym: string, val: string) => {
    setValues((prev) => ({ ...prev, [sym]: val }));
  };

  if (symbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p>No variables configured for this calculator.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      {/* Target Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Solve For
        </label>
        <div className="flex flex-wrap gap-2">
          {symbols.map((sym: string) => (
            <button
              key={sym}
              type="button"
              onClick={() => setTargetSymbol(sym)}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all min-w-[70px] ${
                targetSymbol === sym
                  ? "bg-primary border-primary text-white"
                  : "bg-background border-border text-foreground hover:bg-secondary"
              }`}
            >
              {variables[sym] || sym} ({sym})
            </button>
          ))}
        </div>
      </div>

      {/* Inputs List */}
      <div className="space-y-4">
        {symbols
          .filter((sym: string) => sym !== targetSymbol)
          .map((sym: string) => (
            <div key={sym} className="space-y-1 text-left">
              <label htmlFor={`input-${sym}`} className="text-xs font-semibold text-foreground">
                {variables[sym] || sym} ({sym})
              </label>
              <div className="relative flex items-center">
                <input
                  id={`input-${sym}`}
                  type="number"
                  step="any"
                  value={values[sym] || ""}
                  onChange={(e) => handleInputChange(sym, e.target.value)}
                  placeholder={`Enter ${((variables[sym] || sym) as string).toLowerCase()}`}
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:border-primary outline-none"
                />
                {unitMap[sym] && (
                  <span className="absolute right-4 text-xs font-semibold text-muted-foreground">
                    {unitMap[sym]}
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Result Display */}
      <div className="mt-2 p-4 rounded-2xl bg-secondary border border-border/40 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Result ({targetSymbol})
        </div>
        {errorMsg ? (
          <div className="text-sm font-bold text-red-500">{errorMsg}</div>
        ) : result !== null ? (
          <div className="text-2xl font-black text-primary">
            {result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            <span className="text-sm font-bold text-muted-foreground ml-1">
              {unitMap[targetSymbol] || ""}
            </span>
          </div>
        ) : (
          <div className="text-sm font-semibold text-muted-foreground">
            Waiting for values...
          </div>
        )}
      </div>
    </div>
  );
}

