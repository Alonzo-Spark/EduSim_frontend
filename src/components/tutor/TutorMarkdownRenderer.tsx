import React, { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AlertTriangle, CheckCircle2, Lightbulb, ListChecks, Sparkles, FunctionSquare, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { FormulaCard } from "./FormulaCard";

type Density = "compact" | "regular" | "spacious";
type SectionKind = "default" | "concepts" | "summary" | "applications" | "note" | "mistakes" | "comparison" | "formula" | "examples";

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
  content: string;
  className?: string;
  density?: Density;
}

const SECTION_KIND_MATCHERS: Array<{ kind: SectionKind; patterns: RegExp[] }> = [
  { kind: "concepts", patterns: [/key concepts?/i, /concepts?/i, /core ideas?/i, /important ideas?/i] },
  { kind: "summary", patterns: [/summary/i, /key takeaways?/i, /revision/i, /recap/i] },
  { kind: "applications", patterns: [/applications?/i, /real world/i, /uses?/i, /industry usage/i] },
  { kind: "note", patterns: [/important notes?/i, /notes?/i, /warning/i, /caution/i] },
  { kind: "mistakes", patterns: [/common mistakes?/i, /mistakes?/i, /pitfalls?/i] },
  { kind: "comparison", patterns: [/advantages?/i, /disadvantages?/i, /pros and cons/i, /comparison/i] },
  { kind: "formula", patterns: [/formulas?/i, /equations?/i, /mathematics?/i, /expressions?/i, /derivatives?/i] },
  { kind: "examples", patterns: [/examples?/i, /worked examples?/i, /practice examples?/i, /illustrations?/i] },
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

function splitIntoSections(content: string): SectionBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
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

  return sections.length > 0 ? sections : [{ id: "body-1", level: 2, title: "", kind: "default", body: content }];
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
  if (React.isValidElement(node)) return flattenText(node.props.children);
  return "";
}

// Helper to check if string contains latex block or inline math
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

function renderMarkdownBody(body: string, sectionKind: SectionKind, density: Density, isDark: boolean) {
  const components: Components = {
    h1: ({ children }) => (
      <h1
        id={slugify(flattenText(children))}
        className="scroll-mt-28 text-lg sm:text-xl font-bold tracking-tight text-slate-100 border-l-2 border-violet-500 pl-3 mt-4 mb-2.5"
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={slugify(flattenText(children))}
        className="scroll-mt-28 text-base sm:text-lg font-semibold text-slate-200 border-l border-white/20 pl-2.5 mt-3 mb-2"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-sm sm:text-base font-medium text-slate-300 mt-2 mb-1.5">{children}</h3>
    ),
    p: ({ children }) => {
      // If paragraph contains math, let it take its full natural width (disable line length constraint for math blocks if needed, but text stays readable)
      const contentStr = flattenText(children);
      const isMathy = hasMath(contentStr);
      return (
        <p className={cn(
          "text-slate-300 text-sm sm:text-[15px] leading-relaxed w-full",
          isMathy ? "max-w-none" : "max-w-[85ch]",
          density === "compact" ? "mb-1" : "mb-2"
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
    hr: () => <hr className="my-4 border-slate-800/60" />,
    blockquote: ({ children }) => {
      const toneClasses = sectionKind === "mistakes"
        ? "border-red-500/40 bg-red-500/8 text-red-50 dark:text-red-100"
        : sectionKind === "note"
          ? "border-amber-500/40 bg-amber-500/8"
          : "border-primary/30 bg-primary/6";

      const toneIcon = sectionKind === "mistakes"
        ? <AlertTriangle className="h-4 w-4 text-red-400" />
        : sectionKind === "note"
          ? <Sparkles className="h-4 w-4 text-amber-400" />
          : <Lightbulb className="h-4 w-4 text-primary" />;

      return (
        <div className={cn("my-3 rounded-2xl border px-4 py-2.5 shadow-sm", toneClasses)}>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {toneIcon}
            <span>{sectionKind === "mistakes" ? "Common Mistakes" : sectionKind === "note" ? "Important Note" : "Callout"}</span>
          </div>
          <div className="space-y-1.5 text-[14px] leading-relaxed text-foreground/90">{children}</div>
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
          <div className="my-2.5 flex flex-wrap gap-1.5">
            {texts.map((text) => (
              <span
                key={text}
                className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/12"
              >
                {text.replace(/^[-•✓✔]\s*/, "")}
              </span>
            ))}
          </div>
        );
      }

      if (isApplicationList || isExampleList) {
        const icon = isApplicationList
          ? <Sparkles className="h-4 w-4 text-violet-400" />
          : <BookOpen className="h-4 w-4 text-sky-400" />;
        const hoverAccent = isApplicationList
          ? "hover:border-violet-500/20 hover:bg-violet-500/[0.02]"
          : "hover:border-sky-500/20 hover:bg-sky-500/[0.02]";

        return (
          <div className="my-3 space-y-2">
            {texts.map((text, index) => (
              <div
                key={`${text}-${index}`}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border border-slate-900 bg-slate-950/20 px-4 py-2.5 transition-all duration-200",
                  hoverAccent
                )}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-foreground transition-all">
                  {icon}
                </div>
                <div className="text-sm leading-relaxed text-slate-300 group-hover:text-slate-200 transition-colors">
                  {text.replace(/^[-•✓✔]\s*/, "")}
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (isSummaryList || isMistakeList) {
        const accentClasses = isMistakeList
          ? "border-red-500/20 bg-red-500/8 text-red-100"
          : "border-emerald-500/20 bg-emerald-500/8";

        const icon = isMistakeList
          ? <AlertTriangle className="h-4 w-4 text-red-400" />
          : <CheckCircle2 className="h-4 w-4 text-emerald-400" />;

        return (
          <div className="my-2.5 grid gap-2">
            {texts.map((text, index) => (
              <div key={`${text}-${index}`} className={cn("rounded-2xl border px-3.5 py-2.5 shadow-sm transition-colors hover:border-primary/30", accentClasses)}>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 bg-background/60">
                    {icon}
                  </div>
                  <div className="min-w-0 text-sm leading-relaxed text-foreground/90">{text.replace(/^[-•✓✔]\s*/, "")}</div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <ul className="my-2 space-y-1.5 pl-0">
          {items}
        </ul>
      );
    },
    ol: ({ children }) => {
      const items = React.Children.toArray(children);
      return <ol className="my-2 space-y-1.5 pl-0">{items}</ol>;
    },
    li: ({ children }) => (
      <li className="relative flex gap-2 rounded-xl border border-white/5 bg-white/[0.01] px-3 py-1.5 text-xs sm:text-sm leading-relaxed text-slate-300 shadow-sm transition-all hover:border-primary/15 hover:bg-white/[0.03]">
        <span className="mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[7px] font-bold text-primary">
          •
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    ),
    table: ({ children }) => (
      <div className="my-3 overflow-hidden rounded-xl border border-white/5 bg-slate-950/20 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs sm:text-sm">{children}</table>
        </div>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-white/[0.02] border-b border-white/5">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-white/[0.01]">{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-muted-foreground text-[10px] sm:text-[11px] border-b border-white/5">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2.5 align-top text-foreground/80 leading-relaxed border-b border-white/5">
        {children}
      </td>
    ),
    code: ({ inline, children }) => {
      if (inline) {
        return (
          <code className="rounded-md border border-primary/15 bg-primary/8 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-primary">
            {children}
          </code>
        );
      }

      return (
        <code className="block overflow-x-auto rounded-2xl border border-border/70 bg-slate-950/95 px-4 py-3 font-mono text-sm leading-relaxed text-slate-100 shadow-inner">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <div className="my-3 overflow-hidden rounded-2xl border border-border/70 bg-slate-950/95 shadow-lg">{children}</div>,
  };

  return (
    <div
      className={cn(
        "tutor-markdown prose prose-slate max-w-none",
        isDark && "prose-invert",
        density === "compact" && "prose-p:mb-3",
        density === "spacious" && "prose-p:mb-5",
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {body}
      </ReactMarkdown>
    </div>
  );
}

function SectionCard({ section, density, isDark, parentContent }: { section: SectionBlock; density: Density; isDark: boolean; parentContent: string }) {
  const headingClassName = "text-lg sm:text-xl font-bold tracking-tight text-slate-100 border-l-2 border-violet-500 pl-3 mt-2 mb-4";

  const isCallout = section.kind === "note" || section.kind === "mistakes" || section.kind === "applications";

  const sectionShell = cn(
    "w-full min-w-0 max-w-full pb-6 mb-6 last:border-none last:pb-0 last:mb-0 transition-all",
    isCallout
      ? cn(
          "rounded-xl border p-4 sm:p-5 shadow-sm",
          section.kind === "note" && "border-amber-500/20 bg-amber-500/5",
          section.kind === "mistakes" && "border-red-500/20 bg-red-500/5",
          section.kind === "applications" && "border-violet-500/10 bg-violet-500/5",
        )
      : "bg-transparent border-b border-slate-800/40 p-0 shadow-none",
  );

  // Formula sections get the dedicated textbook reference card layout
  if (section.kind === "formula") {
    return (
      <section id={section.id} className="mb-6 last:mb-0 pb-6 border-b border-slate-800/40 last:border-none last:pb-0">
        {section.title && (
          <div className="mb-3 flex items-center gap-2">
            <FunctionSquare className="w-4.5 h-4.5 text-violet-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-violet-300">
              {section.title}
            </h2>
          </div>
        )}
        <FormulaCard body={section.body} sectionTitle={section.title} parentContent={parentContent} />
      </section>
    );
  }

  return (
    <section id={section.id} className={sectionShell}>
      {section.title && (
        <div className="mb-3">
          <h2 className={headingClassName}>{section.title}</h2>
        </div>
      )}
      <div className="space-y-1.5">
        {renderMarkdownBody(section.body, section.kind, density, isDark)}
      </div>
    </section>
  );
}

function ComparisonCard({ group, density, isDark }: { group: ComparisonGroup; density: Density; isDark: boolean }) {
  const leftLabel = group.left.title;
  const rightLabel = group.right.title;

  return (
    <section className="w-full mb-6 last:mb-0 pb-6 border-b border-slate-800/40 last:border-none last:pb-0">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground border-l-2 border-violet-500 pl-2.5">
        <ListChecks className="h-4 w-4 text-primary" />
        Comparison
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[{ label: leftLabel, section: group.left }, { label: rightLabel, section: group.right }].map(({ label, section }) => (
          <div
            key={section.id}
            className={cn(
              "rounded-xl border border-slate-800 bg-slate-900/25 px-4 py-4 shadow-sm",
              section.kind === "comparison" && "border-primary/15 bg-primary/4",
              section.title.toLowerCase().includes("disadv") && "border-red-500/10 bg-red-500/4",
              section.title.toLowerCase().includes("advant") && "border-emerald-500/10 bg-emerald-500/4",
            )}
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
            <div className={cn("space-y-1.5", isDark && "prose-invert")}>{renderMarkdownBody(section.body, section.kind, density, isDark)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TutorMarkdownRenderer({ content, className, density = "regular" }: TutorMarkdownRendererProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const groups = useMemo(() => groupSections(splitIntoSections(content)), [content]);

  if (!content.trim()) {
    return null;
  }

  return (
    <div className={cn("space-y-3.5", className)}>
      {groups.map((group) => {
        if ("type" in group) {
          return <ComparisonCard key={group.id} group={group} density={density} isDark={isDark} />;
        }

        return <SectionCard key={group.id} section={group} density={density} isDark={isDark} parentContent={content} />;
      })}
    </div>
  );
}