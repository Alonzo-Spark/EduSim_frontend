import React, { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { BlockMath } from "@/components/math/Katex";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { FormulaCard } from "./FormulaCard";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ListChecks, 
  Sparkles, 
  BookOpen, 
  FunctionSquare, 
  Search, 
  Lightbulb,
  HelpCircle,
  Compass,
  Bookmark,
  Sliders,
  Brain
} from "lucide-react";
import "katex/dist/katex.min.css";

type Density = "compact" | "regular" | "spacious";
type SectionKind = 
  | "default" 
  | "concepts" 
  | "summary" 
  | "applications" 
  | "note" 
  | "mistakes" 
  | "comparison" 
  | "formula" 
  | "examples" 
  | "questions"
  | "introduction"
  | "definition"
  | "characteristics";

type SectionBlock = {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  kind: SectionKind;
  body: string;
};

type ComparisonGroup = {
  type: "comparison";
  id: string;
  left: SectionBlock;
  right: SectionBlock;
};

type MarkdownGroup = SectionBlock | ComparisonGroup;

interface TutorMarkdownRendererProps {
  content: unknown;
  className?: string;
  density?: Density;
}

const SECTION_KIND_MATCHERS: Array<{ kind: SectionKind; patterns: RegExp[] }> = [
  { kind: "introduction", patterns: [/introduction/i, /intro/i, /background/i] },
  { kind: "definition", patterns: [/definitions?/i, /what is/i, /meaning/i, /define/i] },
  { kind: "characteristics", patterns: [/characteristics?/i, /properties?/i, /features?/i] },
  { kind: "concepts", patterns: [/key concepts?/i, /concepts?/i, /core ideas?/i, /important ideas?/i] },
  { kind: "summary", patterns: [/summary/i, /key takeaways?/i, /revision/i, /recap/i] },
  { kind: "applications", patterns: [/applications?/i, /real world/i, /uses?/i, /industry usage/i] },
  { kind: "note", patterns: [/important notes?/i, /notes?/i, /warning/i, /caution/i] },
  { kind: "mistakes", patterns: [/common mistakes?/i, /mistakes?/i, /pitfalls?/i] },
  { kind: "comparison", patterns: [/advantages?/i, /disadvantages?/i, /pros and cons/i, /comparison/i] },
  { kind: "formula", patterns: [/formulas?/i, /equations?/i, /mathematics?/i, /expressions?/i, /derivatives?/i] },
  { kind: "examples", patterns: [/examples?/i, /worked examples?/i, /practice examples?/i, /illustrations?/i] },
  { kind: "questions", patterns: [/questions?/i, /q&a/i, /questions & answers/i, /suggested questions/i] },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/["'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function detectSectionKind(title: string): SectionKind {
  for (const matcher of SECTION_KIND_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(title))) {
      return matcher.kind;
    }
  }
  return "default";
}

function normalizeContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content === "number" || typeof content === "boolean") return String(content);
  if (Array.isArray(content)) {
    return content.map((item) => normalizeContent(item)).filter(Boolean).join("\n");
  }
  if (typeof content === "object") {
    const structured = content as Record<string, unknown>;
    const orderedKeys = [
      "title",
      "introduction",
      "definition",
      "keyConcepts",
      "characteristics",
      "mathematicalFormulas",
      "formulaExplanation",
      "derivation",
      "detailedExample",
      "advantagesDisadvantages",
      "applications",
      "industryUsage",
      "importantNotes",
      "summary",
      "suggestedQuestions",
    ];

    const textParts = orderedKeys
      .map((key) => structured[key])
      .filter((value) => value !== undefined)
      .map((value) => normalizeContent(value))
      .filter(Boolean);

    if (textParts.length > 0) {
      return textParts.join("\n\n");
    }

    return JSON.stringify(content, null, 2);
  }
  return String(content);
}

function splitIntoSections(content: unknown): SectionBlock[] {
  const normalizedContent = normalizeContent(content);
  if (!normalizedContent.trim()) {
    return [];
  }

  const lines = normalizedContent.replace(/\r\n/g, "\n").split("\n");
  const sections: SectionBlock[] = [];
  let currentTitle = "";
  let currentLevel: 1 | 2 | 3 = 2;
  let currentBody: string[] = [];
  let currentKind: SectionKind = "default";

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (!currentTitle && !body) {
      currentBody = [];
      return;
    }

    sections.push({
      id: currentTitle ? slugify(currentTitle) : `body-${sections.length + 1}`,
      level: currentLevel,
      title: currentTitle,
      kind: currentKind,
      body,
    });

    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentLevel = headingMatch[1].length as 1 | 2 | 3;
      currentTitle = headingMatch[2].trim();
      currentKind = detectSectionKind(currentTitle);
      continue;
    }

    currentBody.push(line);
  }

  flush();

  return sections.length > 0 ? sections : [{ id: "body-1", level: 2, title: "", kind: "default", body: normalizedContent }];
}

function isComparisonPair(left: SectionBlock, right: SectionBlock) {
  const leftTitle = left.title.toLowerCase();
  const rightTitle = right.title.toLowerCase();
  const leftAdvantages = /advantages?/.test(leftTitle);
  const rightAdvantages = /advantages?/.test(rightTitle);
  const leftDisadvantages = /disadvantages?/.test(leftTitle);
  const rightDisadvantages = /disadvantages?/.test(rightTitle);

  return (leftAdvantages && rightDisadvantages) || (leftDisadvantages && rightAdvantages);
}

function groupSections(sections: SectionBlock[]): MarkdownGroup[] {
  const groups: MarkdownGroup[] = [];

  for (let index = 0; index < sections.length; index += 1) {
    const current = sections[index];
    const next = sections[index + 1];

    if (current.title && next?.title && isComparisonPair(current, next)) {
      groups.push({
        type: "comparison",
        id: `${current.id}-${next.id}`,
        left: current,
        right: next,
      });
      index += 1;
      continue;
    }

    groups.push(current);
  }

  return groups;
}

function flattenText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(" ");
  if (React.isValidElement(node)) return flattenText((node.props as any).children);
  return "";
}

function hasMath(text: string): boolean {
  return /[$]/.test(text);
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function listItemTexts(children: React.ReactNode) {
  return React.Children.toArray(children)
    .map((child) => flattenText(child).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function getSectionIcon(kind: SectionKind) {
  switch (kind) {
    case "introduction":
      return <Compass className="w-5 h-5 text-sky-500" />;
    case "definition":
      return <Bookmark className="w-5 h-5 text-indigo-500" />;
    case "concepts":
      return <Brain className="w-5 h-5 text-purple-500" />;
    case "characteristics":
      return <Sliders className="w-5 h-5 text-pink-500" />;
    case "formula":
      return <FunctionSquare className="w-5 h-5 text-violet-500" />;
    case "applications":
      return <Sparkles className="w-5 h-5 text-emerald-500" />;
    case "summary":
      return <CheckCircle2 className="w-5 h-5 text-amber-500" />;
    case "note":
      return <Lightbulb className="w-5 h-5 text-blue-500" />;
    case "mistakes":
      return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    case "questions":
      return <HelpCircle className="w-5 h-5 text-teal-500" />;
    case "examples":
      return <BookOpen className="w-5 h-5 text-orange-500" />;
    default:
      return <Sparkles className="w-5 h-5 text-slate-400" />;
  }
}

function getSectionColorClasses(kind: SectionKind): { border: string; bg: string; text: string } {
  switch (kind) {
    case "introduction":
      return { border: "border-l-sky-500", bg: "bg-sky-500/5", text: "text-sky-600 dark:text-sky-400" };
    case "definition":
      return { border: "border-l-indigo-500", bg: "bg-indigo-500/5", text: "text-indigo-600 dark:text-indigo-400" };
    case "concepts":
      return { border: "border-l-purple-500", bg: "bg-purple-500/5", text: "text-purple-600 dark:text-purple-400" };
    case "characteristics":
      return { border: "border-l-pink-500", bg: "bg-pink-500/5", text: "text-pink-600 dark:text-pink-400" };
    case "formula":
      return { border: "border-l-violet-500", bg: "bg-violet-500/5", text: "text-violet-600 dark:text-violet-400" };
    case "applications":
      return { border: "border-l-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-600 dark:text-emerald-400" };
    case "summary":
      return { border: "border-l-amber-500", bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400" };
    case "note":
      return { border: "border-l-blue-500", bg: "bg-blue-500/5", text: "text-blue-600 dark:text-blue-400" };
    case "mistakes":
      return { border: "border-l-rose-500", bg: "bg-rose-500/5", text: "text-rose-600 dark:text-rose-400" };
    case "questions":
      return { border: "border-l-teal-500", bg: "bg-teal-500/5", text: "text-teal-600 dark:text-teal-400" };
    case "examples":
      return { border: "border-l-orange-500", bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400" };
    default:
      return { border: "border-l-slate-400 dark:border-l-slate-600", bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400" };
  }
}

function renderMarkdownBody(body: string, sectionKind: SectionKind, density: Density, isDark: boolean) {
  const components: Components = {
    h1: ({ children }) => (
      <h1
        id={slugify(flattenText(children))}
        className="scroll-mt-28 text-base font-bold text-foreground mt-4 mb-2"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={slugify(flattenText(children))}
        className="scroll-mt-28 text-sm font-semibold text-foreground/80 mt-3 mb-1.5"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xs font-semibold text-foreground/70 mt-2 mb-1">{children}</h3>
    ),
    p: ({ children }) => {
      const contentStr = flattenText(children);
      const isMathy = hasMath(contentStr);
      return (
        <p className={cn(
          "text-foreground/80 dark:text-foreground/90 text-sm sm:text-[15px] leading-relaxed w-full font-normal",
          isMathy ? "max-w-none text-center my-3 py-3.5 bg-secondary/20 rounded-2xl border border-border/30" : "max-w-[85ch]",
          density === "compact" ? "mb-1.5" : "mb-3"
        )}>
          {children}
        </p>
      );
    },
    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
    a: ({ children, href }) => (
      <a href={href} className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary">
        {children}
      </a>
    ),
    hr: () => <hr className="my-4 border-border/40" />,
    blockquote: ({ children }) => {
      const toneClasses = sectionKind === "mistakes"
        ? "border-rose-500/20 bg-rose-500/5 text-rose-500"
        : sectionKind === "note"
          ? "border-blue-500/20 bg-blue-500/5"
          : "border-primary/20 bg-secondary/40";

      const toneIcon = sectionKind === "mistakes"
        ? <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
        : sectionKind === "note"
          ? <Lightbulb className="h-4.5 w-4.5 text-blue-500" />
          : <Lightbulb className="h-4.5 w-4.5 text-primary" />;

      return (
        <div className={cn("my-3.5 rounded-2xl border px-5 py-4 shadow-sm", toneClasses)}>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">
            {toneIcon}
            <span>{sectionKind === "mistakes" ? "Common Mistakes" : sectionKind === "note" ? "Important Note" : "Callout"}</span>
          </div>
          <div className="space-y-1.5 text-sm leading-relaxed text-foreground/90">{children}</div>
        </div>
      );
    },
    ul: ({ children }) => {
      const items = React.Children.toArray(children);
      const texts = listItemTexts(children);
      const isChipList = sectionKind === "concepts" || (texts.length > 0 && texts.length <= 8 && texts.every((text) => countWords(text) <= 4 && text.length <= 32));
      const isSummaryList = sectionKind === "summary" || texts.some((text) => /^([✓✔-]|\d+\.)/.test(text));
      const isApplicationList = sectionKind === "applications";
      const isExampleList = sectionKind === "examples";
      const isMistakeList = sectionKind === "mistakes";

      if (isChipList) {
        return (
          <div className="my-3 flex flex-wrap gap-2">
            {texts.map((text) => (
              <span
                key={text}
                className="inline-flex items-center rounded-xl border border-primary/10 bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-sm hover:scale-[1.02] hover:border-primary/30 transition-all duration-200"
              >
                {text.replace(/^[-•✓✔]\s*/, "")}
              </span>
            ))}
          </div>
        );
      }

      if (isApplicationList || isExampleList) {
        const icon = isApplicationList
          ? <Sparkles className="h-4 w-4 text-emerald-500" />
          : <BookOpen className="h-4 w-4 text-orange-500" />;
        const hoverAccent = isApplicationList
          ? "hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]"
          : "hover:border-orange-500/30 hover:bg-orange-500/[0.02]";

        return (
          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {texts.map((text, index) => (
              <div
                key={`${text}-${index}`}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/20 px-4 py-3.5 transition-all duration-300 shadow-sm",
                  hoverAccent
                )}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-background border border-border/30 shadow-sm">
                  {icon}
                </div>
                <div className="text-[13px] leading-relaxed text-foreground/80 group-hover:text-foreground transition-colors">
                  {text.replace(/^[-•✓✔]\s*/, "")}
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (isSummaryList || isMistakeList) {
        const accentClasses = isMistakeList
          ? "border-rose-500/10 bg-rose-500/[0.01] hover:border-rose-500/30 hover:bg-rose-500/[0.02] text-foreground"
          : "border-amber-500/10 bg-amber-500/[0.01] hover:border-amber-500/30 hover:bg-amber-500/[0.02] text-foreground";

        const icon = isMistakeList
          ? <AlertTriangle className="h-4 w-4 text-rose-500" />
          : <CheckCircle2 className="h-4 w-4 text-amber-500" />;

        return (
          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {texts.map((text, index) => (
              <div key={`${text}-${index}`} className={cn("rounded-2xl border px-4 py-3.5 shadow-sm transition-all duration-300", accentClasses)}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                    {icon}
                  </div>
                  <div className="min-w-0 text-sm leading-relaxed text-foreground/80">{text.replace(/^[-•✓✔]\s*/, "")}</div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <ul className="my-2 space-y-2 pl-0">
          {items}
        </ul>
      );
    },
    ol: ({ children }) => {
      const items = React.Children.toArray(children);
      return <ol className="my-2 space-y-2 pl-0">{items}</ol>;
    },
    li: ({ children }) => (
      <li className="relative flex gap-2.5 rounded-2xl border border-border/40 bg-card px-4 py-3 text-xs sm:text-sm leading-relaxed text-foreground/80 shadow-sm transition-all hover:border-primary/20 hover:bg-secondary/40">
        <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary">
          •
        </span>
        <span className="min-w-0 flex-1 font-medium">{children}</span>
      </li>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-hidden rounded-2xl border border-border/40 bg-card/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-[13px] sm:text-sm">{children}</table>
        </div>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-secondary/60 border-b border-border/60">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border/30">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-secondary/10 even:bg-secondary/5">{children}</tr>,
    th: ({ children }) => (
      <th className="px-5 py-3 font-bold uppercase tracking-wider text-muted-foreground text-[10px] sm:text-[11px] border-b border-border/40">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-5 py-3 align-middle text-foreground/80 leading-relaxed">
        {children}
      </td>
    ),
    code: (props: any) => {
      const { inline, children } = props;
      if (inline) {
        return (
          <code className="rounded-md border border-primary/15 bg-primary/8 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-primary">
            {children}
          </code>
        );
      }

      return (
        <code className="block overflow-x-auto rounded-2xl border border-border/40 bg-secondary/35 px-4 py-3.5 font-mono text-[13px] leading-relaxed text-foreground shadow-inner">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <div className="my-4 overflow-hidden rounded-2xl border border-border bg-secondary/40 shadow-md">{children}</div>,
  };

  const preprocessedBody = useMemo(() => {
    let newBody = body;
    newBody = newBody.replace(/a = v\.e \/ l\.m/g, 'a = \\frac{v \\cdot e}{l \\cdot m}');
    newBody = newBody.replace(/v\.e/g, 'v \\cdot e');
    newBody = newBody.replace(/l\.m/g, 'l \\cdot m');
    return newBody;
  }, [body]);

  return (
    <div
      className={cn(
        "tutor-markdown prose prose-slate max-w-none w-full",
        isDark && "prose-invert",
        density === "compact" && "prose-p:mb-2.5",
        density === "spacious" && "prose-p:mb-4.5",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {preprocessedBody}
      </ReactMarkdown>
    </div>
  );
}

function SectionCard({ section, density, isDark, parentContent }: { section: SectionBlock; density: Density; isDark: boolean; parentContent: string }) {
  const colorClasses = getSectionColorClasses(section.kind);
  const icon = getSectionIcon(section.kind);

  const hasTitle = !!section.title;
  const displayTitle = section.title || "Introduction";
  const displayKind = section.title ? section.kind : "introduction";
  
  const finalColorClasses = section.title ? colorClasses : getSectionColorClasses("introduction");
  const finalIcon = section.title ? icon : getSectionIcon("introduction");

  if (section.kind === "formula") {
    return (
      <section 
        id={section.id} 
        className="mb-6 last:mb-0 transition-all duration-300 rounded-[2rem] border border-border/40 bg-card/60 p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-violet-500/30 border-l-4 border-l-violet-500"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
            {finalIcon}
          </div>
          <h2 className="text-base font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {displayTitle}
          </h2>
        </div>
        <FormulaCard body={section.body} sectionTitle={section.title} parentContent={parentContent} />
      </section>
    );
  }

  return (
    <section 
      id={section.id} 
      className={cn(
        "w-full min-w-0 max-w-full rounded-[2rem] border border-border/40 bg-card/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 mb-6 last:mb-0 border-l-4",
        finalColorClasses.border
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-background border border-border/30 shadow-sm flex items-center justify-center">
          {finalIcon}
        </div>
        <h2 className={cn("text-base sm:text-lg font-extrabold tracking-tight", finalColorClasses.text)}>
          {displayTitle}
        </h2>
      </div>
      <div className="space-y-2">
        {renderMarkdownBody(section.body, section.kind, density, isDark)}
      </div>
    </section>
  );
}

function ComparisonCard({ group, density, isDark }: { group: ComparisonGroup; density: Density; isDark: boolean }) {
  const leftLabel = group.left.title;
  const rightLabel = group.right.title;

  return (
    <section className="w-full mb-6 last:mb-0 rounded-[2rem] border border-border/40 bg-card/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
      <div className="mb-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
          <ListChecks className="h-5 w-5" />
        </div>
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          Comparison: Advantages & Disadvantages
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {[{ label: leftLabel, section: group.left }, { label: rightLabel, section: group.right }].map(({ label, section }) => {
          const isDisadvantage = section.title.toLowerCase().includes("disadv") || label.toLowerCase().includes("disadv");
          return (
            <div
              key={section.id}
              className={cn(
                "rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-200 hover:scale-[1.01]",
                isDisadvantage
                  ? "border-rose-500/20 bg-rose-500/[0.02] hover:border-rose-500/35"
                  : "border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/35",
              )}
            >
              <div className={cn(
                "mb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                isDisadvantage ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {isDisadvantage ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{label}</span>
              </div>
              <div className={cn("space-y-1.5", isDark && "prose-invert")}>
                {renderMarkdownBody(section.body, section.kind, density, isDark)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TutorMarkdownRenderer({ content, className, density = "regular" }: TutorMarkdownRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const normalizedStr = useMemo(() => normalizeContent(content), [content]);
  const groups = useMemo(() => groupSections(splitIntoSections(normalizedStr)), [normalizedStr]);

  if (!normalizedStr.trim()) {
    return null;
  }

  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto w-full", className)}>
      {groups.map((group) => {
        if ("type" in group) {
          return <ComparisonCard key={group.id} group={group} density={density} isDark={isDark} />;
        }

        return <SectionCard key={group.id} section={group} density={density} isDark={isDark} parentContent={normalizedStr} />;
      })}

      <style>{`
        .tutor-markdown .katex-display {
          margin: 1.25rem 0;
          padding: 1.25rem;
          background: rgba(120, 119, 198, 0.05);
          border: 1px solid rgba(120, 119, 198, 0.12);
          border-radius: 1.25rem;
          overflow-x: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02);
        }
        .tutor-markdown .katex {
          font-size: 1.05em;
        }
        .tutor-markdown blockquote {
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}