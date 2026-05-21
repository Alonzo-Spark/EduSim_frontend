import React, { useEffect } from "react";
import { useFormulaLab } from "@/hooks/useFormulaLab";
import FormulaNavigator from "./FormulaNavigator";
import FormulaAnatomy from "./FormulaAnatomy";
import FormulaPlayground from "./FormulaPlayground";
import FormulaGraph from "./FormulaGraph";
import AIInsightPanel from "./AIInsightPanel";
import WorkedExamples from "./WorkedExamples";
import PracticeQuestions from "./PracticeQuestions";
import RevisionCards from "./RevisionCards";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string; // optional pre-fetched RAG content
}

const FormulaLabPage: React.FC<Props> = ({ topic, classId, subject, chapter, ragContent }) => {
  const { formulas, selectedFormula, selectFormula, detectedCount, loadForTopic } = useFormulaLab();

  useEffect(() => {
    // initialize
    loadForTopic({ topic, classId, subject, chapter, ragContent });
  }, [topic, classId, subject, chapter, ragContent]);

  const fallbackCard = (
    <div className="w-full rounded-[2rem] border border-red-500/20 bg-red-950/10 p-6 text-sm text-red-100 shadow-2xl">
      <h2 className="text-2xl font-semibold">Formula Lab unavailable</h2>
      <p className="mt-3 text-red-100/80">
        Formula Lab hit an error while loading this topic. You can continue using Tutor or reload the page.
      </p>
    </div>
  );

  if (!formulas) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">Loading formulas...</div>
    );
  }

  if (detectedCount === 0) {
    return (
      <div className="p-6 glass-card rounded-3xl">
        <h2 className="text-2xl font-semibold">Formula Lab</h2>
        <p className="mt-4 text-muted-foreground">No formulas detected for this topic.</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-8 space-y-6">
      <header className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Formula Lab</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {topic} • {subject || ""} {classId ? `• Class ${classId}` : ""}
          </div>
          {selectedFormula && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {selectedFormula.description || "No description available."}
            </p>
          )}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground/90">
          Detected Formulas: {detectedCount}
        </div>
      </header>

      <ErrorBoundary fallback={fallbackCard}>
        <motion.div layout className="space-y-4">
          <FormulaNavigator formulas={formulas} selected={selectedFormula?.id || selectedFormula?.raw} onSelect={selectFormula} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FormulaAnatomy formula={selectedFormula} />
            <FormulaPlayground formula={selectedFormula} />
            <FormulaGraph formula={selectedFormula} />
            <AIInsightPanel formula={selectedFormula} />
            <WorkedExamples formula={selectedFormula} />
            <PracticeQuestions formula={selectedFormula} />
            <RevisionCards formula={selectedFormula} />
          </div>
        </motion.div>
      </ErrorBoundary>
    </div>
  );
};

export default FormulaLabPage;
