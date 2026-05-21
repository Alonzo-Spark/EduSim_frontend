import React, { useState } from "react";
import { FormulaGraph } from "@/utils/formulaTemplates";
import { FormulaSimulation } from "@/utils/formulaTemplates";
import { extractFormulas } from "@/utils/formulaParser";
import { BlockMath } from "react-katex";
import { Activity, BookOpen, Calculator, LineChart, PlaySquare, HelpCircle, X } from "lucide-react";
import { useTutorStore } from "@/store/tutorStore";

interface Props {
  formulaRaw: string;
}

type TabType = "overview" | "calculator" | "graph" | "simulation" | "quiz";

export default function InteractiveFormulaCard({ formulaRaw }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { setActiveFormulaId } = useTutorStore();
  
  // Extract formula details
  const parsed = extractFormulas(formulaRaw);
  const formulaDef = parsed[0]?.matchedDefinition;
  
  const title = formulaDef?.title || "Formula Explanation";
  const expression = formulaDef?.expression || formulaRaw;
  const variables = formulaDef?.variables || {};
  
  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "calculator", label: "Calculator", icon: Calculator },
    { id: "graph", label: "Graph", icon: LineChart },
    { id: "simulation", label: "Simulation", icon: PlaySquare },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
  ] as const;

  return (
    <div className="w-full rounded-[1.75rem] border border-violet-400/30 bg-background/50 shadow-2xl backdrop-blur-3xl overflow-hidden mt-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={() => setActiveFormulaId(null)}
          className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Header / KaTeX Display */}
      <div className="pt-8 pb-6 px-6 bg-gradient-to-br from-violet-500/10 to-transparent border-b border-white/5 flex flex-col items-center">
        <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {title}
        </h4>
        <div className="text-3xl sm:text-4xl">
          <BlockMath math={expression} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-violet-400 text-violet-300" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[300px]">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Variables</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(variables).length > 0 ? (
                Object.entries(variables).map(([symbol, name]) => (
                  <div key={symbol} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-300 font-serif italic text-lg">
                      {symbol}
                    </div>
                    <span className="text-sm text-muted-foreground">{name}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Unknown formula. No variables mapped.</p>
              )}
            </div>
            
            <div className="pt-4 flex gap-3">
               <button className="px-4 py-2 rounded-xl bg-white/10 text-sm font-medium hover:bg-white/15 transition-colors">
                 Generate Quiz from Formula
               </button>
            </div>
          </div>
        )}

        {activeTab === "calculator" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground space-y-4">
            <Calculator className="w-8 h-8 text-violet-400/50" />
            <p>Interactive calculator inputs will appear here.</p>
            <button className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm font-medium hover:bg-violet-500/30 transition-colors">
              Try Example Values
            </button>
          </div>
        )}

        {activeTab === "graph" && (
          <div className="w-full h-[300px] relative">
            <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center">Loading graph...</div>}>
              <FormulaGraph formulaDef={formulaDef} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "simulation" && (
          <div className="w-full h-[300px] relative flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
            <React.Suspense fallback={<div className="absolute inset-0 flex items-center justify-center">Loading simulation...</div>}>
              <FormulaSimulation formulaDef={formulaDef} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <HelpCircle className="w-8 h-8 text-violet-400/50 mb-4" />
            <p>Generate a mini-quiz specifically for this formula.</p>
          </div>
        )}
      </div>
    </div>
  );
}
