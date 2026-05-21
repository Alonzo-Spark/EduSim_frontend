import { parse as mathParse, evaluate as mathEvaluate } from "mathjs";
import { FormulaLabMatchContext, matchFormulaLabProfiles, solveFormulaLab } from "@/data/formulaLabProfiles";
import { FormulaDefinition } from "@/data/formulaRegistry";

export interface ParsedFormula {
  raw: string;
  expression: string;
  id?: string;
  title?: string;
  profileId?: string;
  description?: string;
  variables: Record<string, string>;
  unitMap: Record<string, string>;
  graph?: FormulaDefinition['graph'];
  category?: string;
  importance?: number;
}

export function parseRagContent(ragContent: string, context?: FormulaLabMatchContext): ParsedFormula[] {
  const found = matchFormulaLabProfiles(ragContent, context);
  const parsed: ParsedFormula[] = [];

  for (const match of found) {
    const profile = match.profile;
    const expr = profile.expression;
    const variables = profile.anatomy.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.symbol] = entry.meaning;
      return acc;
    }, {});
    const unitMap = profile.anatomy.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.symbol] = entry.unit;
      return acc;
    }, {});

    parsed.push({
      raw: profile.expression,
      expression: expr,
      id: profile.id,
      title: profile.title,
      profileId: profile.id,
      description: profile.description,
      variables,
      unitMap,
      category: profile.category,
      importance: match.score + profile.importance,
    });
  }

  // sort by importance
  parsed.sort((a,b) => (b.importance || 0) - (a.importance || 0));
  return parsed;
}

function extractVariablesFromExpression(expr: string): Record<string, string> {
  try {
    const node = mathParse(expr);
    const vars: Record<string, string> = {};
    node.filter((n: any) => n.isSymbolNode).forEach((s: any) => {
      vars[s.name] = s.name;
    });
    return vars;
  } catch (e) {
    // fallback: simple regex
    const matches = expr.match(/[A-Za-z]+/g) || [];
    const out: Record<string, string> = {};
    for (const m of matches) out[m] = m;
    return out;
  }
}

export function evaluateFormula(parsed: ParsedFormula, values: Record<string, number>) {
  const profileId = parsed.profileId || parsed.id;
  if (profileId) {
    const result = solveFormulaLab(profileId, values);
    return result.status === "ok" && typeof result.value === "number" ? result.value : NaN;
  }

  // Build a safe scope for eval
  try {
    const scope: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) scope[k] = v;
    // Convert expression to mathjs-friendly form
    const expr = parsed.expression.replace(/\^/g, '**');
    // Remove variable descriptions like 'F = ' if present
    const rhs = expr.includes('=') ? expr.split('=').slice(1).join('=') : expr;
    const res = mathEvaluate(rhs, scope);
    return res;
  } catch (e) {
    return NaN;
  }
}
