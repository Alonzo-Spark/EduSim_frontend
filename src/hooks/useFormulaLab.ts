import { useCallback, useState, useEffect } from "react";
import { physicsSimulationApi } from "@/services/physicsSimulationApi";
import { DynamicFormulaExtractor, DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";

interface LoadParams {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string;
}

export function useFormulaLab() {
  const [formulas, setFormulas] = useState<DynamicParsedFormula[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadForTopic = useCallback(
    async (params: LoadParams) => {
      const cacheKey = `formula-lab-v4:${params.topic}-${params.classId || ""}-${params.subject || ""}-${params.chapter || ""}`;

      const cached = typeof window !== "undefined" ? window.localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          const parsed: DynamicParsedFormula[] = JSON.parse(cached);
          setFormulas(parsed);

          setSelectedIndex(0);

          return;
        } catch {
          // ignore cache parse failures
        }
      }

      setFormulas(null);

      let rag = params.ragContent || null;
      if (!rag) {
        const response = await physicsSimulationApi.queryRag(params.topic);
        rag = response.success && response.data ? response.data.answer : "";
      }

      const parsed = await DynamicFormulaExtractor.parseTutorResponse(
        rag || "",
        params.topic,
        params.subject,
        params.classId,
      );
      console.log("[FormulaLab] formulas received:", parsed);
      console.log(
        "[useFormulaLab] Detected formulas:",
        parsed.map((p) => ({ id: p.id, raw: p.raw, display: p.displayFormula })),
      );
      console.log(
        "[useFormulaLab] Parsed variables:",
        parsed.map((p) => p.variables),
      );
      console.log(
        "[FormulaLab] formulas received:",
        parsed.map((p) => ({
          id: p.id,
          displayFormula: p.displayFormula || p.formula || p.latex || p.raw,
        })),
      );
      console.log("[FormulaLab] count:", parsed.length);
      setFormulas(parsed);

      setSelectedIndex(0);

      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch {
        // ignore storage failures
      }
    },
    [],
  );

  const selectFormula = useCallback(
    (raw: string) => {
      if (!formulas) return;
      const idx = formulas.findIndex((formula) => formula.id === raw || formula.raw === raw);
      if (idx >= 0) setSelectedIndex(idx);
    },
    [formulas],
  );

  const selectedFormula = formulas && formulas.length > 0 ? formulas[selectedIndex] : null;

  // Reset selection when formulas change to avoid stale selectedIndex
  useEffect(() => {
    if (!formulas || formulas.length === 0) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex < 0 || selectedIndex >= formulas.length) {
      setSelectedIndex(0);
    }
  }, [formulas, selectedIndex]);

  return {
    formulas,
    selectedFormula,
    selectFormula,
    detectedCount: formulas ? formulas.length : 0,
    loadForTopic,
  };
}

export default useFormulaLab;
