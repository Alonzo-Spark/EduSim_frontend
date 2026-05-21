import { parse as mathParse } from "mathjs";

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
  expression: string;
  latex?: string;
  formula?: string;
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

const DISALLOWED_SYMBOLS = new Set(["sin", "cos", "tan", "log", "ln", "exp", "pi", "e"]);

function extractSymbols(expr: string): string[] {
  const symbols: string[] = [];

  try {
    const node = mathParse(expr) as unknown as {
      filter: (
        predicate: (child: unknown) => boolean,
      ) => Array<{ name?: string; isSymbolNode?: boolean }>;
    };

    node
      .filter((child) =>
        Boolean(
          child && typeof child === "object" && (child as { isSymbolNode?: boolean }).isSymbolNode,
        ),
      )
      .forEach((symbolNode) => {
        const name = symbolNode.name;
        if (name && !symbols.includes(name) && !DISALLOWED_SYMBOLS.has(name)) {
          symbols.push(name);
        }
      });
  } catch {
    const fallbackMatches = expr.match(/[a-zA-Z_]+/g) || [];
    fallbackMatches.forEach((symbol) => {
      if (!symbols.includes(symbol) && !DISALLOWED_SYMBOLS.has(symbol)) {
        symbols.push(symbol);
      }
    });
  }

  return symbols;
}

function normalizeMathExpression(expr: string): string {
  let res = expr;
  res = res.replace(/½/g, "0.5").replace(/1\/2/g, "0.5");
  res = res.replace(/²/g, "^2").replace(/³/g, "^3");
  res = res.replace(/([\d.]+)([a-zA-Z])/g, "$1*$2");

  res = res.replace(/\b([a-zA-Z])([a-zA-Z])([a-zA-Z])\b/g, (match, p1, p2, p3) => {
    const funcs = ["sin", "cos", "tan", "log", "exp", "cot", "sec", "csc", "max", "min"];
    if (funcs.includes(match.toLowerCase())) return match;
    return `${p1}*${p2}*${p3}`;
  });

  res = res.replace(/\b([a-zA-Z])([a-zA-Z])\b/g, (match, p1, p2) => {
    const exceptions = ["pi", "ln", "dr", "dt", "dx", "dy", "KE", "PE"];
    if (exceptions.includes(match)) return match;
    return `${p1}*${p2}`;
  });

  return res;
}

export const DynamicFormulaExtractor = {
  parseTutorResponse(
    content: string,
    topic: string,
    subject?: string,
    classId?: string,
  ): DynamicParsedFormula[] {
    console.log("FULL_RESPONSE", content);
    const formulas: DynamicParsedFormula[] = [];
    if (!content) return formulas;

    const displayRegex = /\$\$(.*?)\$\$/g;
    const inlineRegex = /\$([^$\n]+?)\$/g;

    const matches = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = displayRegex.exec(content)) !== null) {
      if (match[1].includes("=")) {
        matches.add(match[1].trim());
      }
    }

    while ((match = inlineRegex.exec(content)) !== null) {
      if (match[1].includes("=") && /[a-zA-Z]/.test(match[1])) {
        matches.add(match[1].trim());
      }
    }

    if (matches.size === 0) return [];

    const anatomyTableRegex = /\|.*?Symbol.*?\|.*?Meaning.*?\|[\s\S]*?(?=\n\n|\n##|$)/i;
    const anatomyMatch = content.match(anatomyTableRegex);
    const anatomy: FormulaAnatomyRow[] = [];

    if (anatomyMatch) {
      const rows = anatomyMatch[0].split("\n").filter((row) => row.trim().startsWith("|"));

      for (let i = 2; i < rows.length; i += 1) {
        const cols = rows[i]
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);

        if (cols.length >= 2) {
          anatomy.push({
            symbol: cols[0].replace(/\*/g, ""),
            meaning: cols[1].replace(/\*/g, ""),
            unit: cols[2] ? cols[2].replace(/\*/g, "") : "",
          });
        }
      }
    }

    const examplesRegex = /##\s*(?:Worked\s*)?Examples?([\s\S]*?)(?=\n##|$)/i;
    const examplesMatch = content.match(examplesRegex);
    const examples: FormulaExample[] = [];

    if (examplesMatch) {
      const exampleText = examplesMatch[1].trim();
      const subExamples = exampleText.split(/\n(?=\*\*Example|\d+\.)/i).filter(Boolean);

      subExamples.forEach((example, idx) => {
        examples.push({ title: `Example ${idx + 1}`, content: example.trim() });
      });

      if (examples.length === 0 && exampleText) {
        examples.push({ title: "Example", content: exampleText });
      }
    }

    const pqRegex = /##\s*(?:Suggested\s*|Practice\s*)Questions?([\s\S]*?)(?=\n##|$)/i;
    const pqMatch = content.match(pqRegex);
    const practiceQuestions: FormulaPracticeQuestion[] = [];

    if (pqMatch) {
      const pqText = pqMatch[1].trim();
      const qLines = pqText.split("\n").filter((line) => line.trim().match(/^[0-9]+\.|^-/));

      qLines.forEach((questionLine) => {
        practiceQuestions.push({ question: questionLine.replace(/^[0-9]+\.|-/, "").trim() });
      });
    }

    const rtRegex = /##\s*Related\s*Topics?([\s\S]*?)(?=\n##|$)/i;
    const rtMatch = content.match(rtRegex);
    const relatedTopics: string[] = [];

    if (rtMatch) {
      const rtLines = rtMatch[1]
        .trim()
        .split("\n")
        .filter((line) => line.trim().match(/^-\s*/));

      rtLines.forEach((topicLine) => {
        relatedTopics.push(topicLine.replace(/^-/, "").trim());
      });
    }

    const revisionCards: FormulaRevisionCard[] = anatomy.map((row) => ({
      front: `What does ${row.symbol} represent?`,
      back: row.meaning,
    }));

    let idCounter = 1;
    for (const latex of matches) {
      let expr = latex
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, "($1)/($2)")
        .replace(/\\cdot/g, "*")
        .replace(/\\times/g, "*")
        .replace(/\\left/g, "")
        .replace(/\\right/g, "")
        .replace(/\\sin/g, "sin")
        .replace(/\\cos/g, "cos")
        .replace(/\\tan/g, "tan")
        .replace(/[{}]/g, "")
        .replace(/\\/g, "");

      let resultSymbol = "y";
      if (expr.includes("=")) {
        const parts = expr.split("=");
        resultSymbol = parts[0].trim();
        expr = parts[1].trim();
      }

      expr = normalizeMathExpression(expr);

      const formulaAnatomy = [...anatomy];
      const symbols = extractSymbols(expr);

      symbols.forEach((symbol) => {
        if (!formulaAnatomy.find((row) => row.symbol === symbol) && symbol !== resultSymbol) {
          formulaAnatomy.push({ symbol, meaning: symbol, unit: "" });
        }
      });

      const controls: FormulaControl[] = symbols
        .filter((symbol) => symbol !== resultSymbol)
        .map((symbol) => {
          const an = formulaAnatomy.find((row) => row.symbol === symbol);
          let def = 10, min = 1, max = 100, step = 1;
          const l = symbol.toLowerCase();
          if (l === 'm') { def = 10; max = 100; }
          else if (l === 'a') { def = 5; max = 20; }
          else if (l === 'v') { def = 12; max = 240; }
          else if (l === 'r') { def = 4; max = 100; }
          else if (l === 'i') { def = 2; max = 20; }
          else if (l === 't') { def = 10; max = 100; }
          else if (l === 'f') { def = 50; max = 500; }
          else if (l === 'h') { def = 5; max = 50; }
          else if (l === 'c') { def = 300; max = 500; }
          else if (l === 'n') { def = 1.5; max = 3; step = 0.1; }

          return {
            symbol,
            label: an?.meaning || symbol,
            unit: an?.unit || "",
            min, max, step, defaultValue: def,
          };
        });

      const escapedLatex = latex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const explanationRegex = new RegExp(`([^\\n]+)\\n+.*${escapedLatex}.*\\n+([^\\n]+)`, "i");
      const explMatch = content.match(explanationRegex);

      let description = content;
      formulas.push({
        id: `f-${idCounter++}`,
        raw: latex,
        expression: expr,
        latex,
        formula: latex,
        title: resultSymbol ? `Formula for ${resultSymbol}` : "Formula",
        category: subject,
        topic,
        description,
        anatomy: formulaAnatomy.filter(
          (row) => symbols.includes(row.symbol) || row.symbol === resultSymbol,
        ),
        examples,
        practiceQuestions,
        revisionCards,
        relatedTopics,
        controls,
        variables: controls,
        resultSymbol,
      });
    }

    return formulas;
  },
};
