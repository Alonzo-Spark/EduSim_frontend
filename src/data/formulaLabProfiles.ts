export type FormulaCategory = "physics" | "math" | "chemistry";

export interface FormulaControl {
  symbol: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface FormulaAnatomyRow {
  symbol: string;
  meaning: string;
  unit: string;
}

export interface FormulaExample {
  title: string;
  given: Record<string, number>;
  find: string;
  steps: string[];
}

export interface FormulaPracticeQuestion {
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  answer: string;
  solution: string;
}

export interface FormulaRevisionCard {
  question: string;
  answer: string;
}

export interface FormulaGraphConfig {
  xSymbol: string;
  ySymbol: string;
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
}

export interface FormulaSolveResult {
  status: "ok" | "missing" | "invalid";
  symbol: string;
  label: string;
  value?: number;
  message?: string;
}

export interface FormulaLabProfile {
  id: string;
  title: string;
  category: FormulaCategory;
  expression: string;
  latex: string;
  description: string;
  aliases: string[];
  importance: number;
  resultSymbol: string;
  controls: FormulaControl[];
  anatomy: FormulaAnatomyRow[];
  graph: FormulaGraphConfig;
  summaryPoints: string[];
  insights: (values: Record<string, number>) => string[];
  examples: FormulaExample[];
  practiceQuestions: FormulaPracticeQuestion[];
  revisionCards: FormulaRevisionCard[];
  solve: (values: Record<string, number>) => FormulaSolveResult;
}

export interface FormulaLabMatch {
  profile: FormulaLabProfile;
  score: number;
  mentionCount: number;
}

export interface FormulaLabMatchContext {
  topic?: string;
  chapter?: string;
  subject?: string;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeFormulaText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[_{}]/g, "")
    .replace(/\\(?:sin|cos|tan|theta|frac|sqrt|times|cdot|left|right)/g, (match) => {
      if (match === "\\sin") return "sin";
      if (match === "\\cos") return "cos";
      if (match === "\\tan") return "tan";
      if (match === "\\theta") return "theta";
      if (match === "\\frac") return "/";
      if (match === "\\sqrt") return "sqrt";
      if (match === "\\times" || match === "\\cdot") return "*";
      return "";
    })
    .replace(/[^a-z0-9=+\-*/^(). ]+/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

function containsAny(value: string, tokens: string[]) {
  return tokens.some((token) => value.includes(token));
}

function normalizeTokens(value: string) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function toTokenSet(value: string) {
  return new Set(normalizeTokens(value));
}

function topicTagsForProfile(profileId: string): string[] {
  switch (profileId) {
    case "ohms-law":
      return ["electricity", "electric", "current", "resistance", "voltage", "circuit", "ohm", "power"];
    case "newtons-second-law":
      return ["force", "motion", "acceleration", "dynamics", "mechanics", "newton"];
    case "snells-law":
    case "refractive-index":
      return ["light", "optics", "refraction", "lens", "refractive", "ray"];
    case "kinetic-energy":
      return ["energy", "motion", "mechanics", "kinetic", "velocity"];
    case "ideal-gas-law":
      return ["gas", "pressure", "temperature", "chemistry", "thermodynamics"];
    case "momentum":
      return ["momentum", "collision", "motion", "mechanics", "impulse"];
    case "magnification":
      return ["optics", "image", "lens", "magnification", "mirror"];
    default:
      return [];
  }
}

function overlapScore(contextTokens: Set<string>, tags: string[]) {
  if (!contextTokens.size || tags.length === 0) return 0;
  let overlap = 0;
  for (const tag of tags) {
    if (contextTokens.has(tag)) {
      overlap += 1;
    }
  }
  return overlap;
}

function findContextWindow(text: string, aliases: string[]) {
  const lower = (text || "").toLowerCase();
  let bestWindow = "";
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx < 0) continue;
    const start = Math.max(0, idx - 160);
    const end = Math.min(text.length, idx + alias.length + 160);
    const window = text.slice(start, end);
    if (window.length > bestWindow.length) {
      bestWindow = window;
    }
  }
  return bestWindow;
}

function buildPoints(
  start: number,
  end: number,
  step: number,
  mapper: (x: number) => number | null,
) {
  const points: Array<{ x: number; y: number }> = [];
  for (let x = start; x <= end; x += step) {
    const y = mapper(x);
    if (typeof y === "number" && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function missingMessage(label: string) {
  return `Missing ${label}`;
}

const profiles: FormulaLabProfile[] = [
  {
    id: "snells-law",
    title: "Snell's Law",
    category: "physics",
    expression: "n₁ sin(i) = n₂ sin(r)",
    latex: "n_1 \\sin(i) = n_2 \\sin(r)",
    description: "Describes how light bends when it passes between two media with different refractive indices.",
    aliases: ["snell's law", "snells law", "n1sin(i)=n2sin(r)", "n1sin(theta1)=n2sin(theta2)"] ,
    importance: 100,
    resultSymbol: "r",
    controls: [
      { symbol: "n₁", label: "Refractive index of medium 1", unit: "", min: 1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { symbol: "n₂", label: "Refractive index of medium 2", unit: "", min: 1, max: 2.5, step: 0.05, defaultValue: 1.5 },
      { symbol: "i", label: "Angle of incidence", unit: "°", min: 0, max: 80, step: 1, defaultValue: 30 },
    ],
    anatomy: [
      { symbol: "n₁", meaning: "Refractive index of the first medium", unit: "" },
      { symbol: "n₂", meaning: "Refractive index of the second medium", unit: "" },
      { symbol: "i", meaning: "Angle of incidence", unit: "°" },
      { symbol: "r", meaning: "Angle of refraction", unit: "°" },
    ],
    graph: { xSymbol: "i", ySymbol: "r", xLabel: "Angle of incidence", yLabel: "Angle of refraction", xUnit: "°", yUnit: "°" },
    summaryPoints: [
      "Light bends toward the normal when it enters a denser medium.",
      "A larger refractive index means a slower wave speed.",
      "The ratio n₁/n₂ controls the amount of bending.",
    ],
    insights: (values) => {
      const n1 = values["n₁"] ?? 1;
      const n2 = values["n₂"] ?? 1.5;
      const i = values.i ?? 30;
      const ratio = n1 / n2;
      return [
        `Current ratio n₁/n₂ = ${ratio.toFixed(2)}. Lower ratios bend light more strongly.`,
        `At i = ${i.toFixed(0)}°, the refracted angle stays below the incident angle when n₂ > n₁.`,
        `If n₂ increases, r decreases because the ray slows down more in medium 2.`,
      ];
    },
    solve: (values) => {
      const n1 = values["n₁"];
      const n2 = values["n₂"];
      const i = values.i;
      if (typeof n1 !== "number") return { status: "missing", symbol: "n₁", label: "Refractive index of medium 1", message: missingMessage("n₁") };
      if (typeof n2 !== "number") return { status: "missing", symbol: "n₂", label: "Refractive index of medium 2", message: missingMessage("n₂") };
      if (typeof i !== "number") return { status: "missing", symbol: "i", label: "Angle of incidence", message: missingMessage("i") };
      const ratio = (n1 / n2) * Math.sin(i * DEG_TO_RAD);
      if (Math.abs(ratio) > 1) {
        return { status: "invalid", symbol: "r", label: "Angle of refraction", message: "Total internal reflection: no real refraction angle" };
      }
      const r = Math.asin(ratio) * RAD_TO_DEG;
      return { status: "ok", symbol: "r", label: "Angle of refraction", value: r };
    },
    examples: [
      { title: "Light entering glass", given: { "n₁": 1.0, "n₂": 1.5, i: 30 }, find: "r", steps: ["Substitute the values into Snell's law.", "Compute sin(r) = (n₁/n₂) sin(i).", "Take arcsin to find the refraction angle."] },
      { title: "Water to air", given: { "n₁": 1.33, "n₂": 1.0, i: 25 }, find: "r", steps: ["Check whether total internal reflection occurs.", "If the ratio is valid, evaluate the refraction angle."] },
    ],
    practiceQuestions: [
      { difficulty: "Easy", question: "If n₂ increases while i stays fixed, what happens to r?", answer: "r decreases", solution: "A denser second medium bends the ray closer to the normal." },
      { difficulty: "Medium", question: "Find r when n₁=1.0, n₂=1.5, i=45°.", answer: "28.1°", solution: "Use Snell's law and evaluate arcsin((1.0/1.5)sin45°)." },
      { difficulty: "Hard", question: "When does Snell's law produce no real refraction angle?", answer: "When total internal reflection occurs", solution: "If (n₁/n₂)sin(i) > 1, the arcsin has no real solution." },
    ],
    revisionCards: [
      { question: "What does n₁ represent?", answer: "Refractive index of medium 1" },
      { question: "What does i represent?", answer: "Angle of incidence" },
      { question: "What does r represent?", answer: "Angle of refraction" },
    ],
  },
  {
    id: "refractive-index",
    title: "Refractive Index",
    category: "physics",
    expression: "n = c / v",
    latex: "n = \\frac{c}{v}",
    description: "Measures how much light slows down inside a medium.",
    aliases: ["refractive index", "n=c/v", "n = c / v"],
    importance: 90,
    resultSymbol: "n",
    controls: [
      { symbol: "c", label: "Speed of light in vacuum", unit: "m/s", min: 2.5e8, max: 3.1e8, step: 1e6, defaultValue: 3.0e8 },
      { symbol: "v", label: "Speed in medium", unit: "m/s", min: 1e8, max: 3e8, step: 1e6, defaultValue: 2.0e8 },
    ],
    anatomy: [
      { symbol: "n", meaning: "Refractive index", unit: "" },
      { symbol: "c", meaning: "Speed of light in vacuum", unit: "m/s" },
      { symbol: "v", meaning: "Speed of light in the medium", unit: "m/s" },
    ],
    graph: { xSymbol: "v", ySymbol: "n", xLabel: "Speed in medium", yLabel: "Refractive index", xUnit: "m/s", yUnit: "" },
    summaryPoints: [
      "A larger refractive index means light moves more slowly.",
      "Refractive index is a ratio, so it has no unit.",
      "Higher speed in the medium means a smaller refractive index.",
    ],
    insights: (values) => {
      const c = values.c ?? 3e8;
      const v = values.v ?? 2e8;
      const n = c / v;
      return [
        `Current refractive index is ${n.toFixed(2)}.`,
        `If speed falls, n rises because the ratio c/v gets larger.`,
        `The relationship is inverse: doubling v halves n.`,
      ];
    },
    solve: (values) => {
      const c = values.c;
      const v = values.v;
      if (typeof c !== "number") return { status: "missing", symbol: "c", label: "Speed of light in vacuum", message: missingMessage("c") };
      if (typeof v !== "number") return { status: "missing", symbol: "v", label: "Speed in medium", message: missingMessage("v") };
      return { status: "ok", symbol: "n", label: "Refractive index", value: c / v };
    },
    examples: [
      { title: "Glass", given: { c: 3e8, v: 2e8 }, find: "n", steps: ["Substitute c and v.", "Divide c by v."] },
    ],
    practiceQuestions: [
      { difficulty: "Easy", question: "What happens to n when v decreases?", answer: "n increases", solution: "n is inversely proportional to v." },
      { difficulty: "Medium", question: "Find n if c = 3×10⁸ m/s and v = 2×10⁸ m/s.", answer: "1.5", solution: "n = c/v = 3/2 = 1.5." },
      { difficulty: "Hard", question: "Why does refractive index have no unit?", answer: "It is a ratio", solution: "Both c and v have the same unit, so they cancel." },
    ],
    revisionCards: [
      { question: "What does n mean?", answer: "Refractive index" },
      { question: "Does n have a unit?", answer: "No, it is unitless" },
    ],
  },
  {
    id: "newtons-second-law",
    title: "Newton's Second Law",
    category: "physics",
    expression: "F = m a",
    latex: "F = ma",
    description: "Force equals mass multiplied by acceleration.",
    aliases: ["newton's second law", "newtons second law", "f=ma", "force mass acceleration"],
    importance: 80,
    resultSymbol: "F",
    controls: [
      { symbol: "m", label: "Mass", unit: "kg", min: 1, max: 20, step: 1, defaultValue: 5 },
      { symbol: "a", label: "Acceleration", unit: "m/s²", min: 0, max: 20, step: 0.5, defaultValue: 2 },
    ],
    anatomy: [
      { symbol: "F", meaning: "Force", unit: "N" },
      { symbol: "m", meaning: "Mass", unit: "kg" },
      { symbol: "a", meaning: "Acceleration", unit: "m/s²" },
    ],
    graph: { xSymbol: "a", ySymbol: "F", xLabel: "Acceleration", yLabel: "Force", xUnit: "m/s²", yUnit: "N" },
    summaryPoints: [
      "Force grows linearly with acceleration when mass stays fixed.",
      "More mass means more force is needed for the same acceleration.",
    ],
    insights: (values) => {
      const m = values.m ?? 5;
      const a = values.a ?? 2;
      return [
        `With m = ${m} kg and a = ${a} m/s², force changes linearly.`,
        `Doubling mass doubles the required force at the same acceleration.`,
      ];
    },
    solve: (values) => {
      const m = values.m;
      const a = values.a;
      if (typeof m !== "number") return { status: "missing", symbol: "m", label: "Mass", message: missingMessage("m") };
      if (typeof a !== "number") return { status: "missing", symbol: "a", label: "Acceleration", message: missingMessage("a") };
      return { status: "ok", symbol: "F", label: "Force", value: m * a };
    },
    examples: [
      { title: "Pushing a cart", given: { m: 6, a: 3 }, find: "F", steps: ["Multiply mass by acceleration.", "F = 6 × 3."] },
    ],
    practiceQuestions: [
      { difficulty: "Easy", question: "What happens to force if acceleration doubles?", answer: "It doubles", solution: "F is directly proportional to a." },
      { difficulty: "Medium", question: "Find F if m=8 kg and a=4 m/s².", answer: "32 N", solution: "F = ma = 8 × 4." },
      { difficulty: "Hard", question: "Why does a heavier object need more force for the same acceleration?", answer: "Because force is proportional to mass", solution: "F = ma shows mass is a direct multiplier." },
    ],
    revisionCards: [
      { question: "What does F mean?", answer: "Force" },
      { question: "What does m mean?", answer: "Mass" },
      { question: "What does a mean?", answer: "Acceleration" },
    ],
  },
  {
    id: "ohms-law",
    title: "Ohm's Law",
    category: "physics",
    expression: "V = I R",
    latex: "V = I R",
    description: "Voltage across a conductor is the product of current and resistance.",
    aliases: ["ohm's law", "ohms law", "v=ir"],
    importance: 75,
    resultSymbol: "V",
    controls: [
      { symbol: "I", label: "Current", unit: "A", min: 0, max: 20, step: 0.5, defaultValue: 2 },
      { symbol: "R", label: "Resistance", unit: "Ω", min: 1, max: 50, step: 1, defaultValue: 10 },
    ],
    anatomy: [
      { symbol: "V", meaning: "Voltage", unit: "V" },
      { symbol: "I", meaning: "Current", unit: "A" },
      { symbol: "R", meaning: "Resistance", unit: "Ω" },
    ],
    graph: { xSymbol: "I", ySymbol: "V", xLabel: "Current", yLabel: "Voltage", xUnit: "A", yUnit: "V" },
    summaryPoints: ["Voltage increases linearly with current when resistance is fixed."],
    insights: (values) => [`Voltage is ${((values.I ?? 2) * (values.R ?? 10)).toFixed(1)} V for the current slider setup.`, "Resistance acts as the scaling factor in the line."],
    solve: (values) => {
      const I = values.I;
      const R = values.R;
      if (typeof I !== "number") return { status: "missing", symbol: "I", label: "Current", message: missingMessage("I") };
      if (typeof R !== "number") return { status: "missing", symbol: "R", label: "Resistance", message: missingMessage("R") };
      return { status: "ok", symbol: "V", label: "Voltage", value: I * R };
    },
    examples: [{ title: "Circuit check", given: { I: 3, R: 12 }, find: "V", steps: ["Multiply current by resistance."] }],
    practiceQuestions: [
      { difficulty: "Easy", question: "What happens to voltage when current increases?", answer: "Voltage increases", solution: "V = IR." },
      { difficulty: "Medium", question: "Find V if I=4 A and R=6 Ω.", answer: "24 V", solution: "V = 4 × 6." },
      { difficulty: "Hard", question: "How does resistance affect the line slope in a V-I graph?", answer: "It sets the slope", solution: "V is proportional to I with slope R." },
    ],
    revisionCards: [{ question: "What is V?", answer: "Voltage" }],
  },
  {
    id: "kinetic-energy",
    title: "Kinetic Energy",
    category: "physics",
    expression: "KE = 1/2 m v²",
    latex: "KE = \\frac{1}{2} m v^2",
    description: "Energy of motion increases with mass and the square of velocity.",
    aliases: ["kinetic energy", "ke=1/2mv^2", "1/2mv^2"],
    importance: 70,
    resultSymbol: "KE",
    controls: [
      { symbol: "m", label: "Mass", unit: "kg", min: 1, max: 20, step: 1, defaultValue: 5 },
      { symbol: "v", label: "Velocity", unit: "m/s", min: 0, max: 30, step: 1, defaultValue: 10 },
    ],
    anatomy: [
      { symbol: "KE", meaning: "Kinetic energy", unit: "J" },
      { symbol: "m", meaning: "Mass", unit: "kg" },
      { symbol: "v", meaning: "Velocity", unit: "m/s" },
    ],
    graph: { xSymbol: "v", ySymbol: "KE", xLabel: "Velocity", yLabel: "Kinetic energy", xUnit: "m/s", yUnit: "J" },
    summaryPoints: ["Velocity affects KE more strongly because it is squared."],
    insights: (values) => [`Velocity has the bigger effect because KE grows as v².`, `With v = ${values.v ?? 10} m/s, a small speed change causes a large KE shift.`],
    solve: (values) => {
      const m = values.m;
      const v = values.v;
      if (typeof m !== "number") return { status: "missing", symbol: "m", label: "Mass", message: missingMessage("m") };
      if (typeof v !== "number") return { status: "missing", symbol: "v", label: "Velocity", message: missingMessage("v") };
      return { status: "ok", symbol: "KE", label: "Kinetic energy", value: 0.5 * m * v * v };
    },
    examples: [{ title: "Rolling ball", given: { m: 2, v: 8 }, find: "KE", steps: ["Square the velocity.", "Multiply by mass and 1/2."] }],
    practiceQuestions: [
      { difficulty: "Easy", question: "If v doubles, what happens to KE?", answer: "It becomes four times larger", solution: "KE is proportional to v²." },
      { difficulty: "Medium", question: "Find KE if m=4 kg and v=6 m/s.", answer: "72 J", solution: "KE = 1/2 × 4 × 6²." },
      { difficulty: "Hard", question: "Why is KE more sensitive to velocity than mass?", answer: "Because velocity is squared", solution: "The square makes speed changes much more influential." },
    ],
    revisionCards: [{ question: "What is KE?", answer: "Kinetic energy" }],
  },
  {
    id: "ideal-gas-law",
    title: "Ideal Gas Law",
    category: "chemistry",
    expression: "P V = n R T",
    latex: "P V = n R T",
    description: "Relates pressure, volume, moles, gas constant, and temperature.",
    aliases: ["ideal gas law", "pv=nrt"],
    importance: 60,
    resultSymbol: "P",
    controls: [
      { symbol: "V", label: "Volume", unit: "L", min: 1, max: 20, step: 1, defaultValue: 10 },
      { symbol: "n", label: "Amount of gas", unit: "mol", min: 1, max: 10, step: 1, defaultValue: 2 },
      { symbol: "T", label: "Temperature", unit: "K", min: 200, max: 500, step: 10, defaultValue: 300 },
      { symbol: "R", label: "Gas constant", unit: "L·atm/(mol·K)", min: 0.08, max: 0.09, step: 0.001, defaultValue: 0.082 },
    ],
    anatomy: [
      { symbol: "P", meaning: "Pressure", unit: "atm" },
      { symbol: "V", meaning: "Volume", unit: "L" },
      { symbol: "n", meaning: "Amount of gas", unit: "mol" },
      { symbol: "R", meaning: "Gas constant", unit: "L·atm/(mol·K)" },
      { symbol: "T", meaning: "Temperature", unit: "K" },
    ],
    graph: { xSymbol: "V", ySymbol: "P", xLabel: "Volume", yLabel: "Pressure", xUnit: "L", yUnit: "atm" },
    summaryPoints: ["Pressure falls as volume grows when other variables stay fixed."],
    insights: (values) => {
      const V = values.V ?? 10;
      const n = values.n ?? 2;
      const T = values.T ?? 300;
      return [
        `At V = ${V} L, pressure drops when the gas expands.`,
        `Higher temperature pushes pressure up because molecules move faster.`,
        `More moles increase pressure when volume and temperature stay fixed.`,
      ];
    },
    solve: (values) => {
      const V = values.V;
      const n = values.n;
      const R = values.R;
      const T = values.T;
      if (typeof V !== "number") return { status: "missing", symbol: "V", label: "Volume", message: missingMessage("V") };
      if (typeof n !== "number") return { status: "missing", symbol: "n", label: "Amount of gas", message: missingMessage("n") };
      if (typeof R !== "number") return { status: "missing", symbol: "R", label: "Gas constant", message: missingMessage("R") };
      if (typeof T !== "number") return { status: "missing", symbol: "T", label: "Temperature", message: missingMessage("T") };
      return { status: "ok", symbol: "P", label: "Pressure", value: (n * R * T) / V };
    },
    examples: [{ title: "Gas in a container", given: { V: 10, n: 2, R: 0.082, T: 300 }, find: "P", steps: ["Use P = nRT / V."] }],
    practiceQuestions: [
      { difficulty: "Easy", question: "What happens to pressure if volume increases?", answer: "Pressure decreases", solution: "P is inversely proportional to V." },
      { difficulty: "Medium", question: "Find P when n=2, R=0.082, T=300, V=10.", answer: "4.92 atm", solution: "P = 2 × 0.082 × 300 / 10." },
      { difficulty: "Hard", question: "Which variable most directly links temperature to pressure?", answer: "T", solution: "At fixed n and V, pressure is directly proportional to T." },
    ],
    revisionCards: [{ question: "What does PV = nRT connect?", answer: "Pressure, volume, moles, gas constant, temperature" }],
  },
  {
    id: "momentum",
    title: "Momentum",
    category: "physics",
    expression: "p = m v",
    latex: "p = m v",
    description: "Momentum combines mass and velocity.",
    aliases: ["momentum", "p=mv"],
    importance: 55,
    resultSymbol: "p",
    controls: [
      { symbol: "m", label: "Mass", unit: "kg", min: 1, max: 20, step: 1, defaultValue: 5 },
      { symbol: "v", label: "Velocity", unit: "m/s", min: 0, max: 30, step: 1, defaultValue: 4 },
    ],
    anatomy: [
      { symbol: "p", meaning: "Momentum", unit: "kg·m/s" },
      { symbol: "m", meaning: "Mass", unit: "kg" },
      { symbol: "v", meaning: "Velocity", unit: "m/s" },
    ],
    graph: { xSymbol: "v", ySymbol: "p", xLabel: "Velocity", yLabel: "Momentum", xUnit: "m/s", yUnit: "kg·m/s" },
    summaryPoints: ["Momentum increases linearly with velocity for fixed mass."],
    insights: (values) => [`Momentum is ${(values.m ?? 5) * (values.v ?? 4)} kg·m/s for the current values.`, "Increasing mass or velocity raises momentum in the same proportion."],
    solve: (values) => {
      const m = values.m;
      const v = values.v;
      if (typeof m !== "number") return { status: "missing", symbol: "m", label: "Mass", message: missingMessage("m") };
      if (typeof v !== "number") return { status: "missing", symbol: "v", label: "Velocity", message: missingMessage("v") };
      return { status: "ok", symbol: "p", label: "Momentum", value: m * v };
    },
    examples: [{ title: "Moving cart", given: { m: 5, v: 4 }, find: "p", steps: ["Multiply mass by velocity."] }],
    practiceQuestions: [
      { difficulty: "Easy", question: "What happens to momentum when velocity doubles?", answer: "It doubles", solution: "p = mv." },
      { difficulty: "Medium", question: "Find p if m=5 kg and v=4 m/s.", answer: "20 kg·m/s", solution: "p = 5 × 4." },
      { difficulty: "Hard", question: "Why does a heavier object at the same speed have more momentum?", answer: "Because mass is larger", solution: "Mass directly multiplies the velocity term." },
    ],
    revisionCards: [{ question: "What is momentum?", answer: "Mass times velocity" }],
  },
  {
    id: "magnification",
    title: "Magnification",
    category: "physics",
    expression: "m = h_i / h_o",
    latex: "m = \\frac{h_i}{h_o}",
    description: "Describes how much larger or smaller an image appears than the object.",
    aliases: ["magnification", "h' = nh", "h_i/h_o", "hi/ho"],
    importance: 50,
    resultSymbol: "m",
    controls: [
      { symbol: "h_i", label: "Image height", unit: "cm", min: 1, max: 30, step: 1, defaultValue: 12 },
      { symbol: "h_o", label: "Object height", unit: "cm", min: 1, max: 30, step: 1, defaultValue: 6 },
    ],
    anatomy: [
      { symbol: "m", meaning: "Magnification", unit: "" },
      { symbol: "h_i", meaning: "Image height", unit: "cm" },
      { symbol: "h_o", meaning: "Object height", unit: "cm" },
    ],
    graph: { xSymbol: "h_o", ySymbol: "m", xLabel: "Object height", yLabel: "Magnification", xUnit: "cm", yUnit: "" },
    summaryPoints: ["Magnification tells how many times larger the image is than the object."],
    insights: (values) => [`With image height ${values.h_i ?? 12} cm and object height ${values.h_o ?? 6} cm, magnification is ${(values.h_i ?? 12) / (values.h_o ?? 6)}`],
    solve: (values) => {
      const h_i = values.h_i;
      const h_o = values.h_o;
      if (typeof h_i !== "number") return { status: "missing", symbol: "h_i", label: "Image height", message: missingMessage("h_i") };
      if (typeof h_o !== "number") return { status: "missing", symbol: "h_o", label: "Object height", message: missingMessage("h_o") };
      if (h_o === 0) return { status: "invalid", symbol: "m", label: "Magnification", message: "Object height cannot be zero" };
      return { status: "ok", symbol: "m", label: "Magnification", value: h_i / h_o };
    },
    examples: [{ title: "Lens image", given: { h_i: 12, h_o: 6 }, find: "m", steps: ["Divide image height by object height."] }],
    practiceQuestions: [
      { difficulty: "Easy", question: "If image and object heights are equal, what is magnification?", answer: "1", solution: "m = h_i / h_o = 1." },
      { difficulty: "Medium", question: "Find m if h_i = 12 cm and h_o = 6 cm.", answer: "2", solution: "m = 12/6." },
      { difficulty: "Hard", question: "What does m > 1 mean?", answer: "The image is enlarged", solution: "The image is larger than the object." },
    ],
    revisionCards: [{ question: "What is magnification?", answer: "Image height divided by object height" }],
  },
];

export const formulaLabProfiles = profiles;

export function getFormulaLabProfile(profileId: string | undefined | null) {
  if (!profileId) return undefined;
  return profiles.find((profile) => profile.id === profileId);
}

export function matchFormulaLabProfiles(text: string, context?: FormulaLabMatchContext): FormulaLabMatch[] {
  const normalized = normalizeFormulaText(text || "");
  if (!normalized) return [];

  const contextText = [context?.topic || "", context?.chapter || "", context?.subject || ""].join(" ");
  const contextTokens = toTokenSet(contextText);

  const matches: FormulaLabMatch[] = [];

  for (const profile of profiles) {
    const normalizedTitle = normalizeFormulaText(profile.title);
    const normalizedExpression = normalizeFormulaText(profile.expression);
    const aliasHit = profile.aliases.some((alias) => normalized.includes(normalizeFormulaText(alias)));
    const matcherHit = profile.aliases.some((alias) => {
      const aliasNorm = normalizeFormulaText(alias);
      return aliasNorm && normalized.includes(aliasNorm);
    }) || profile.latex && normalized.includes(normalizeFormulaText(profile.latex)) || normalized.includes(normalizedTitle) || normalized.includes(normalizedExpression) || containsAny(normalized, [normalizedTitle.replace(/[^a-z0-9]/g, ""), normalizedExpression.replace(/[^a-z0-9]/g, "")]);

    if (!matcherHit && !aliasHit) {
      continue;
    }

    let score = profile.importance;
    if (normalized.includes(normalizedTitle)) score += 40;
    if (normalized.includes(normalizedExpression)) score += 50;
    if (aliasHit) score += 25;

    const tags = topicTagsForProfile(profile.id);
    const contextOverlap = overlapScore(contextTokens, tags);
    if (contextOverlap > 0) {
      score += contextOverlap * 30;
    }

    const nearbyWindow = findContextWindow(text, [profile.title, ...profile.aliases]);
    if (nearbyWindow) {
      const nearbyTokens = toTokenSet(nearbyWindow);
      const nearbyOverlap = overlapScore(nearbyTokens, tags);
      if (nearbyOverlap > 0) {
        score += nearbyOverlap * 10;
      }
    }

    if (contextTokens.size > 0 && tags.length > 0 && contextOverlap === 0) {
      score -= 90;
    }

    const mentionCount = profile.aliases.reduce((count, alias) => count + (normalized.includes(normalizeFormulaText(alias)) ? 1 : 0), 0);
    if (score >= profile.importance - 30) {
      matches.push({ profile, score, mentionCount });
    }
  }

  matches.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.mentionCount !== b.mentionCount) return b.mentionCount - a.mentionCount;
    return a.profile.title.localeCompare(b.profile.title);
  });

  return matches.slice(0, 5);
}

export function solveFormulaLab(profileId: string, values: Record<string, number>): FormulaSolveResult {
  const profile = getFormulaLabProfile(profileId);
  if (!profile) {
    return { status: "invalid", symbol: "", label: "Formula", message: "Unknown formula" };
  }
  return profile.solve(values);
}

export function buildFormulaGraph(profileId: string, values: Record<string, number>) {
  const profile = getFormulaLabProfile(profileId);
  if (!profile) return [] as Array<{ x: number; y: number }>;

  const base = values;
  const cfg = profile.graph;

  switch (profile.id) {
    case "snells-law": {
      const n1 = base["n₁"] ?? 1;
      const n2 = base["n₂"] ?? 1.5;
      return buildPoints(0, 80, 2, (i) => {
        const ratio = (n1 / n2) * Math.sin(i * DEG_TO_RAD);
        if (Math.abs(ratio) > 1) return null;
        return Math.asin(ratio) * RAD_TO_DEG;
      });
    }
    case "refractive-index": {
      const c = base.c ?? 3e8;
      return buildPoints(1, 10, 0.25, (fraction) => c / (fraction * c));
    }
    case "newtons-second-law": {
      const m = base.m ?? 5;
      return buildPoints(0, 20, 1, (a) => m * a);
    }
    case "ohms-law": {
      const R = base.R ?? 10;
      return buildPoints(0, 20, 1, (I) => I * R);
    }
    case "kinetic-energy": {
      const m = base.m ?? 5;
      return buildPoints(0, 20, 1, (v) => 0.5 * m * v * v);
    }
    case "ideal-gas-law": {
      const n = base.n ?? 2;
      const R = base.R ?? 0.082;
      const T = base.T ?? 300;
      return buildPoints(1, 20, 1, (V) => (n * R * T) / V);
    }
    case "momentum": {
      const m = base.m ?? 5;
      return buildPoints(0, 20, 1, (v) => m * v);
    }
    case "magnification": {
      const h_i = base.h_i ?? 12;
      return buildPoints(1, 24, 1, (h_o) => h_i / h_o);
    }
    default:
      return buildPoints(0, 10, 1, (x) => x);
  }
}

export function buildLabValues(profileId: string) {
  const profile = getFormulaLabProfile(profileId);
  if (!profile) return {} as Record<string, number>;

  return profile.controls.reduce<Record<string, number>>((acc, control) => {
    acc[control.symbol] = control.defaultValue;
    return acc;
  }, {});
}

export function formatFormulaOutput(result: FormulaSolveResult) {
  if (result.status === "ok" && typeof result.value === "number" && Number.isFinite(result.value)) {
    return result.value;
  }
  return result.message || "Missing variable";
}
