import { formatLatexForDisplay } from "@/utils/latexDisplay";

export interface FormulaAnatomyRow {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface FormulaExample {
  title: string;
  content: string;
}

export interface FormulaPracticeQuestion {
  question: string;
  answer?: string;
}

export interface FormulaRevisionCard {
  front: string;
  back: string;
}

export interface FormulaControl {
  symbol: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface DynamicParsedFormula {
  id: string;
  raw: string;
  rawFormula?: string;
  expression: string;
  latex?: string;
  formula?: string;
  displayFormula?: string;
  title?: string;
  description?: string;
  category?: string;
  topic?: string;
  variables?: FormulaControl[];
  anatomy?: FormulaAnatomyRow[];
  examples?: FormulaExample[];
  practiceQuestions?: FormulaPracticeQuestion[];
  revisionCards?: FormulaRevisionCard[];
  relatedTopics?: string[];
  controls?: FormulaControl[];
  resultSymbol?: string;
}

export const DynamicFormulaExtractor = {
  async parseTutorResponse(
    content: string,
    topic: string,
    subject?: string,
    classId?: string,
  ): Promise<DynamicParsedFormula[]> {
    console.log("[DynamicFormulaExtractor] Extracting via backend API...");

    try {
      // 1. Extract formulas from text
      const extractRes = await fetch("http://127.0.0.1:8000/api/formula/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content })
      });
      
      if (!extractRes.ok) throw new Error("Extraction failed");
      const extractData = await extractRes.json();
      const formulasList = extractData.formulas || [];
      
      const parsedFormulas: DynamicParsedFormula[] = [];
      
      // 2. Fetch metadata for each formula
      for (const f of formulasList) {
        try {
          const labRes = await fetch("http://127.0.0.1:8000/api/formula/lab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formula: f.formula })
          });
          
          if (!labRes.ok) continue;
          const labData = await labRes.json();
          
          // Deduplicate controls based on symbol (so we don't have n1, n2, n_1 all duplicated)
          const uniqueControls: FormulaControl[] = [];
          const seenVars = new Set<string>();
          for (const v of labData.variables || []) {
            if (!seenVars.has(v.symbol)) {
              seenVars.add(v.symbol);
              uniqueControls.push({
                symbol: v.symbol,
                label: v.label || v.symbol,
                unit: v.unit || "",
                min: 1, max: 100, step: 1, defaultValue: 10
              });
            }
          }
          
          parsedFormulas.push({
            id: labData.id || f.id,
            raw: f.formula,
            rawFormula: f.formula,
            expression: f.formula,
            latex: f.formula,
            formula: f.formula,
            displayFormula: formatLatexForDisplay(f.formula),
            title: labData.title || "Formula",
            category: subject,
            topic,
            description: labData.description || content,
            variables: uniqueControls,
            controls: uniqueControls,
            anatomy: labData.anatomy || [],
            examples: labData.examples || [],
            resultSymbol: labData.resultSymbol || "y"
          });
        } catch (e) {
          console.warn("Failed to load lab data for formula", f.formula, e);
        }
      }
      
      return parsedFormulas;
    } catch (e) {
      console.error("[DynamicFormulaExtractor] Error:", e);
      return [];
    }
  },
};
