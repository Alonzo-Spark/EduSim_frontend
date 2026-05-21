import { useCallback, useState } from "react";
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
      const selectedId =
        formulas && formulas[selectedIndex]
          ? formulas[selectedIndex].id || formulas[selectedIndex].raw
          : null;

      const cached = typeof window !== "undefined" ? window.localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          const parsed: DynamicParsedFormula[] = JSON.parse(cached);
          setFormulas(parsed);

          if (selectedId) {
            const idx = parsed.findIndex(
              (formula) => formula.id === selectedId || formula.raw === selectedId,
            );
            setSelectedIndex(idx >= 0 ? idx : 0);
          } else {
            setSelectedIndex(0);
          }

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

      const parsed = DynamicFormulaExtractor.parseTutorResponse(
        rag || "",
        params.topic,
        params.subject,
        params.classId,
      );
      setFormulas(parsed);

      if (selectedId) {
        const idx = parsed.findIndex(
          (formula) => formula.id === selectedId || formula.raw === selectedId,
        );
        setSelectedIndex(idx >= 0 ? idx : 0);
      } else {
        setSelectedIndex(0);
      }

      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      } catch {
        // ignore storage failures
      }
    },
    [formulas, selectedIndex],
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

  return {
    formulas,
    selectedFormula,
    selectFormula,
    detectedCount: formulas ? formulas.length : 0,
    loadForTopic,
  };
}

export default useFormulaLab;
