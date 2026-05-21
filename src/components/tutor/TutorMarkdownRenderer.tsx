import React, { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AlertTriangle, CheckCircle2, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type Density = "compact" | "regular" | "spacious";
type SectionKind = "default" | "concepts" | "summary" | "applications" | "note" | "mistakes" | "comparison";

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
        className={cn(
          "scroll-mt-28 border-b border-border/70 pb-4 pt-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl",
          density === "spacious" && "mt-8 pb-5",
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        id={slugify(flattenText(children))}
        className={cn(
          "scroll-mt-28 border-l-4 border-primary/80 pl-4 text-xl font-semibold tracking-tight text-foreground",
          density === "compact" ? "mt-6" : "mt-8",
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground/95">{children}</h3>
    ),
    p: ({ children }) => (
      <p className={cn("text-foreground/90", density === "compact" ? "mb-3 leading-6" : "mb-4 leading-7")}>{children}</p>
    ),
    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
    a: ({ children, href }) => (
      <a href={href} className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary">
        {children}
      </a>
    ),
    hr: () => <hr className="my-6 border-border/70" />,
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
        <div className={cn("my-6 rounded-3xl border px-5 py-4 shadow-sm", toneClasses)}>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {toneIcon}
            <span>{sectionKind === "mistakes" ? "Common Mistakes" : sectionKind === "note" ? "Important Note" : "Callout"}</span>
          </div>
          <div className="space-y-3 text-sm leading-7 text-foreground/90">{children}</div>
        </div>
      );
    },
    ul: ({ children }) => {
      const items = React.Children.toArray(children);
      const texts = listItemTexts(children);
      const isChipList = sectionKind === "concepts" || texts.length > 0 && texts.length <= 8 && texts.every((text) => countWords(text) <= 4 && text.length <= 32);
      const isSummaryList = sectionKind === "summary" || texts.some((text) => /^([✓✔-]|\d+\.)/.test(text));
      const isApplicationList = sectionKind === "applications";
      const isMistakeList = sectionKind === "mistakes";

      if (isChipList) {
        return (
          <div className="my-5 flex flex-wrap gap-2">
            {texts.map((text) => (
              <span
                key={text}
                className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/12"
              >
                {text.replace(/^[-•✓✔]\s*/, "")}
              </span>
            ))}
          </div>
        );
      }

      if (isSummaryList || isApplicationList || isMistakeList) {
        const accentClasses = isMistakeList
          ? "border-red-500/20 bg-red-500/8 text-red-100"
          : isApplicationList
            ? "border-primary/15 bg-primary/8"
            : "border-emerald-500/20 bg-emerald-500/8";

        const icon = isMistakeList
          ? <AlertTriangle className="h-4 w-4 text-red-400" />
          : isApplicationList
            ? <Sparkles className="h-4 w-4 text-primary" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-400" />;

        return (
          <div className="my-5 grid gap-3">
            {texts.map((text, index) => (
              <div key={`${text}-${index}`} className={cn("rounded-2xl border px-4 py-3 shadow-sm transition-colors hover:border-primary/30", accentClasses)}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 bg-background/60">
                    {icon}
                  </div>
                  <div className="min-w-0 text-sm leading-6 text-foreground/90">{text.replace(/^[-•✓✔]\s*/, "")}</div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <ul className="my-4 space-y-3 pl-0">
          {items}
        </ul>
      );
    },
    ol: ({ children }) => {
      const items = React.Children.toArray(children);
      return <ol className="my-4 space-y-3 pl-0">{items}</ol>;
    },
    li: ({ children }) => (
      <li className="relative flex gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-sm leading-6 text-foreground/90 shadow-sm transition-colors hover:border-primary/20 hover:bg-card/90">
        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          •
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    ),
    table: ({ children }) => (
      <div className="tutor-table-shell my-6 rounded-3xl border border-border/70 bg-card/95 shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
        <div className="overflow-x-auto rounded-3xl">
          <table className="min-w-full border-separate border-spacing-0 text-sm">{children}</table>
        </div>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-transparent">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-primary/5">{children}</tr>,
    th: ({ children }) => (
      <th className="sticky top-0 z-10 border-b border-border/70 bg-card/95 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border/50 px-4 py-3 align-top text-foreground/90">
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
        <code className="block overflow-x-auto rounded-3xl border border-border/70 bg-slate-950/95 px-5 py-4 font-mono text-sm leading-7 text-slate-100 shadow-inner">
          {children}
        </code>
      );
    },
    pre: ({ children }) => <div className="my-6 overflow-hidden rounded-3xl border border-border/70 bg-slate-950/95 shadow-xl">{children}</div>,
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

function SectionCard({ section, density, isDark }: { section: SectionBlock; density: Density; isDark: boolean }) {
  const headingClassName = cn(
    section.level === 1 ? "text-3xl md:text-4xl" : "text-xl",
    "font-bold tracking-tight text-foreground",
  );

  const sectionShell = cn(
    "rounded-[2rem] border border-border/50 bg-card/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
    section.kind === "note" && "border-amber-500/20 bg-amber-500/5",
    section.kind === "mistakes" && "border-red-500/20 bg-red-500/5",
    section.kind === "applications" && "border-primary/20 bg-primary/5",
    density === "compact" ? "p-5" : "p-6 md:p-7",
  );

  return (
    <section id={section.id} className={sectionShell}>
      {section.title && (
        <div className="mb-5">
          <h2 className={headingClassName}>{section.title}</h2>
        </div>
      )}
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
    <section className={cn("rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.09)]", density === "spacious" && "md:p-7")}>
      <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
        <ListChecks className="h-4 w-4 text-primary" />
        Comparison
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[{ label: leftLabel, section: group.left }, { label: rightLabel, section: group.right }].map(({ label, section }) => (
          <div
            key={section.id}
            className={cn(
              "rounded-[1.5rem] border px-5 py-5 shadow-sm",
              section.kind === "comparison" && "border-primary/15 bg-primary/6",
              section.title.toLowerCase().includes("disadv") && "border-red-500/20 bg-red-500/6",
              section.title.toLowerCase().includes("advant") && "border-emerald-500/20 bg-emerald-500/6",
            )}
          >
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
            <div className={cn("space-y-2", isDark && "prose-invert")}>{renderMarkdownBody(section.body, section.kind, density, isDark)}</div>
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
    <div className={cn("space-y-6", className)}>
      {groups.map((group) => {
        if ("type" in group) {
          return <ComparisonCard key={group.id} group={group} density={density} isDark={isDark} />;
        }

        return <SectionCard key={group.id} section={group} density={density} isDark={isDark} />;
      })}
    </div>
  );
}