import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { TutorMarkdownRenderer } from "@/components/tutor/TutorMarkdownRenderer";

const AIInsightPanel: React.FC<{ formula: DynamicParsedFormula | null }> = ({ formula }) => {
  if (!formula) return <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">AI insights will appear here once a formula is selected.</div>;

  const relatedTopics = Array.isArray(formula.relatedTopics) ? formula.relatedTopics : [];
  const description = formula.description || "";

  if (!description && relatedTopics.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">AI Insights</p>
        <h3 className="mt-2 text-xl font-bold text-foreground">Related Context</h3>
      </div>
      <div className="grid gap-3">
        {description && (
          <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm leading-6 text-foreground">
             <span className="font-semibold text-primary block mb-3">Context</span>
             <TutorMarkdownRenderer content={description} density="compact" />
          </div>
        )}
        {relatedTopics.length > 0 && (
          <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-sm leading-6 text-foreground">
             <span className="font-semibold text-primary block mb-1">Related Topics</span>
             <ul className="list-disc list-inside space-y-1">
               {relatedTopics.map((topic) => (
                 <li key={topic}>{topic}</li>
               ))}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightPanel;
