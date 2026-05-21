import React, { useEffect } from "react";
import { useFormulaLab } from "@/hooks/useFormulaLab";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import FormulaNavigator from "./FormulaNavigator";
import FormulaAnatomy from "./FormulaAnatomy";
import FormulaPlayground from "./FormulaPlayground";
import FormulaGraph from "./FormulaGraph";
import { motion, AnimatePresence } from "framer-motion";
import QASection from "../tutor/QASection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

interface Props {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string; // optional pre-fetched RAG content
  formulas?: DynamicParsedFormula[] | null;
}

const FormulaLabPage: React.FC<Props> = ({
  topic,
  classId,
  subject,
  chapter,
  ragContent,
  formulas: directFormulas,
}) => {
  const { formulas, selectedFormula, selectFormula, detectedCount, loadForTopic } = useFormulaLab();
  const activeFormulas = directFormulas || formulas;
  const activeCount = activeFormulas ? activeFormulas.length : 0;
  const activeSelectedFormula =
    directFormulas && directFormulas.length > 0 ? directFormulas[0] : selectedFormula;

  useEffect(() => {
    // initialize
    if (!directFormulas) {
      loadForTopic({ topic, classId, subject, chapter, ragContent });
    }
  }, [topic, classId, subject, chapter, ragContent, loadForTopic, directFormulas]);

  useEffect(() => {
    console.log("[FormulaLabPage] received formulas:", activeFormulas);
    console.log("[TutorOutputPanel] showFormulaLab", formulas ? formulas.length : 0);
    console.log("[FormulaLabPage] selectedFormula:", selectedFormula);
  }, [activeFormulas, formulas, selectedFormula]);

  const [values, setValues] = React.useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = React.useState(0);
  
  // Set initial values when formula changes
  useEffect(() => {
    if (activeSelectedFormula && Array.isArray(activeSelectedFormula.controls)) {
      const initial = activeSelectedFormula.controls.reduce<Record<string, number>>((acc, control) => {
        acc[control.symbol] = control.defaultValue;
        return acc;
      }, {});
      setValues(initial);
    } else {
      setValues({});
    }
  }, [activeSelectedFormula?.id, activeSelectedFormula?.raw]);

  const fallbackCard = (
    <div className="w-full rounded-[2rem] border border-red-500/20 bg-red-950/10 p-6 text-sm text-red-100 shadow-2xl">
      <h2 className="text-2xl font-semibold">Formula Lab unavailable</h2>
      <p className="mt-3 text-red-100/80">
        Formula Lab hit an error while loading this topic. You can continue using Tutor or reload
        the page.
      </p>
    </div>
  );

  if (!activeFormulas) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        Loading formulas...
      </div>
    );
  }

  if (activeCount === 0) {
    return (
      <div className="p-6 glass-card rounded-3xl">
        <h2 className="text-2xl font-semibold">Formula Lab</h2>
        <p className="mt-4 text-muted-foreground">No formulas detected for this topic.</p>
      </div>
    );
  }


  const steps = [
    "Formula",
    "Variables",
    "Calculator",
    "Graph",
    "Practice"
  ];

  const renderStep = () => {
    switch(currentStep) {
      case 0:
        return <FormulaAnatomy formula={activeSelectedFormula} mode="overview" />;
      case 1:
        return <FormulaAnatomy formula={activeSelectedFormula} mode="variables" />;
      case 2:
        return <FormulaPlayground formula={activeSelectedFormula} values={values} setValues={setValues} />;
      case 3:
        return <FormulaGraph formula={activeSelectedFormula} values={values} />;
      case 4:
        return (
          <QASection 
            topic={topic} 
            chapter={chapter} 
            subject={subject} 
            formulas={activeFormulas} 
            ragContent={ragContent} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full p-4 md:p-8 space-y-6">
      <header className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Formula Lab</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            {topic} • {subject || ""} {classId ? `• Class ${classId}` : ""}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground/90">
          Detected Formulas: {activeCount}
        </div>
      </header>

      <ErrorBoundary fallback={fallbackCard}>
        <motion.div layout className="space-y-6">
          <FormulaNavigator
            formulas={activeFormulas}
            selected={activeSelectedFormula?.id || activeSelectedFormula?.raw}
            onSelect={selectFormula}
          />

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between w-full rounded-2xl border border-white/10 bg-black/20 p-2 shadow-inner overflow-x-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={step}>
                <div 
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
                    currentStep === idx 
                      ? 'bg-violet-600 text-white shadow-lg scale-105'
                      : currentStep > idx
                        ? 'text-violet-400 hover:bg-white/5'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  {currentStep > idx && <CheckCircle2 className="w-4 h-4" />}
                  {step}
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-1 flex-shrink-0 ${currentStep > idx ? 'text-violet-500' : 'text-white/20'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[300px]"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-foreground hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </motion.div>
      </ErrorBoundary>
    </div>
  );
};

export default FormulaLabPage;
