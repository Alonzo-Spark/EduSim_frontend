import { useState, useCallback } from "react";
import { parseRagContent, ParsedFormula } from "@/utils/FormulaExtractor";
import { physicsSimulationApi } from "@/services/physicsSimulationApi";

interface LoadParams {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string;
}

export function useFormulaLab() {
  const [formulas, setFormulas] = useState<ParsedFormula[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadForTopic = useCallback(async (params: LoadParams) => {
    const cacheKey = `formula-lab-v4:${params.topic}-${params.classId || ''}-${params.subject || ''}-${params.chapter || ''}`;
    const selectedId = formulas && formulas[selectedIndex] ? (formulas[selectedIndex].profileId || formulas[selectedIndex].id || formulas[selectedIndex].raw) : null;

    // Try cache
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsed: ParsedFormula[] = JSON.parse(cached);
        setFormulas(parsed);
        if (selectedId) {
          const idx = parsed.findIndex((f) => f.profileId === selectedId || f.id === selectedId || f.raw === selectedId);
          setSelectedIndex(idx >= 0 ? idx : 0);
        } else {
          setSelectedIndex(0);
        }
        return;
      } catch (e) {
        // ignore
      }
    }

    let rag = params.ragContent || null;
    if (!rag) {
      // call existing RAG API
      const q = params.topic;
      const res = await physicsSimulationApi.queryRag(q);
      rag = res.success && res.data ? res.data.answer : '';
    }

    const parsed = parseRagContent(rag || '', {
      topic: params.topic,
      chapter: params.chapter,
      subject: params.subject,
    });
    setFormulas(parsed);
    if (selectedId) {
      const idx = parsed.findIndex((f) => f.profileId === selectedId || f.id === selectedId || f.raw === selectedId);
      setSelectedIndex(idx >= 0 ? idx : 0);
    } else {
      setSelectedIndex(0);
    }

    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(cacheKey, JSON.stringify(parsed));
    } catch (e) {
      // ignore
    }
  }, [formulas, selectedIndex]);

  const selectFormula = useCallback((raw: string) => {
    if (!formulas) return;
    const idx = formulas.findIndex((f) => f.profileId === raw || f.id === raw || f.raw === raw);
    if (idx >= 0) setSelectedIndex(idx);
  }, [formulas]);

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
