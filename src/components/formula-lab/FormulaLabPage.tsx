import React, { useEffect, useState, useMemo } from "react";
import { useFormulaLab } from "@/hooks/useFormulaLab";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import FormulaAnatomy from "./FormulaAnatomy";
import FormulaPlayground from "./FormulaPlayground";
import FormulaGraph from "./FormulaGraph";
import { motion, AnimatePresence } from "framer-motion";
import QASection from "../tutor/QASection";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  BookOpen, 
  Calculator, 
  LineChart, 
  HelpCircle, 
  Star, 
  History, 
  Compass, 
  Bookmark,
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface Props {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string;
  formulas?: DynamicParsedFormula[] | null;
}

function getFormulaCategory(f: DynamicParsedFormula): string {
  const text = ((f.title || "") + " " + (f.description || "")).toLowerCase();
  if (/force|acceleration|motion|velocity|gravity|momentum|speed|inertia|mass|projectile/i.test(text)) {
    return "Dynamics";
  }
  if (/refraction|reflection|lens|light|wave|sound|frequency|pitch|optics/i.test(text)) {
    return "Waves & Optics";
  }
  if (/electric|magnetic|charge|current|ohm|resistance|voltage|circuit/i.test(text)) {
    return "Electromagnetism";
  }
  return "General Physics";
}

const FormulaLabPage: React.FC<Props> = ({
  topic,
  classId,
  subject,
  chapter,
  ragContent,
  formulas: directFormulas,
}) => {
  const { formulas, selectedFormula, selectFormula, loadForTopic } = useFormulaLab();
  
  const activeFormulas = directFormulas || formulas;
  const activeCount = activeFormulas ? activeFormulas.length : 0;
  
  const activeSelectedFormula =
    directFormulas && directFormulas.length > 0 ? directFormulas[0] : selectedFormula;

  const [values, setValues] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeListTab, setActiveListTab] = useState<"all" | "recent" | "saved">("all");
  const [activeTabId, setActiveTabId] = useState("anatomy");

  // LocalStorage state for Recent and Saved Formulas
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("formula-lab-recent") || "[]");
    } catch {
      return [];
    }
  });

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("formula-lab-saved") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!directFormulas) {
      loadForTopic({ topic, classId, subject, chapter, ragContent });
    }
  }, [topic, classId, subject, chapter, ragContent, loadForTopic, directFormulas]);

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

  // Update recent list when formula changes
  useEffect(() => {
    if (activeSelectedFormula) {
      const id = activeSelectedFormula.id || activeSelectedFormula.raw;
      setRecentIds(prev => {
        const filtered = prev.filter(x => x !== id);
        const updated = [id, ...filtered].slice(0, 8);
        localStorage.setItem("formula-lab-recent", JSON.stringify(updated));
        return updated;
      });
    }
  }, [activeSelectedFormula?.id, activeSelectedFormula?.raw]);

  const toggleSaveFormula = (id: string) => {
    setSavedIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("formula-lab-saved", JSON.stringify(updated));
      return updated;
    });
  };

  // Dynamic Categories extracted from loaded formulas
  const categories = useMemo(() => {
    const list = activeFormulas || [];
    const cats = new Set<string>();
    cats.add("All");
    list.forEach(f => cats.add(getFormulaCategory(f)));
    return Array.from(cats);
  }, [activeFormulas]);

  // Filtered Formulas for Directory List
  const filteredFormulas = useMemo(() => {
    let list = activeFormulas || [];
    if (activeListTab === "recent") {
      list = list.filter(f => recentIds.includes(f.id || f.raw));
    } else if (activeListTab === "saved") {
      list = list.filter(f => savedIds.includes(f.id || f.raw));
    }

    return list.filter(f => {
      const cat = getFormulaCategory(f);
      const matchesCategory = selectedCategory === "All" || cat === selectedCategory;
      const text = (
        (f.title || "") + " " + 
        (f.description || "") + " " + 
        (f.displayFormula || f.formula || f.raw)
      ).toLowerCase();
      const matchesSearch = text.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeFormulas, activeListTab, recentIds, savedIds, selectedCategory, searchQuery]);

  const fallbackCard = (
    <div className="w-full rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-sm text-red-100 shadow-2xl">
      <h2 className="text-xl font-semibold">Formula Lab unavailable</h2>
      <p className="mt-2 text-red-100/70 leading-relaxed">
        Formula Lab hit an error while loading this topic. You can continue using Tutor or reload
        the page.
      </p>
    </div>
  );

  if (!activeFormulas) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center text-slate-400 font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <span>Analyzing textbook formulas...</span>
        </div>
      </div>
    );
  }

  if (activeCount === 0) {
    return (
      <div className="p-8 border border-white/10 bg-slate-950/40 rounded-3xl text-center max-w-lg mx-auto mt-12">
        <Compass className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-200">No Formulas Detected</h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          We couldn't extract any active formulas from this textbook topic. Try asking the AI Tutor to outline the formulas.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "anatomy", label: "Anatomy", icon: BookOpen },
    { id: "solve", label: "Solve", icon: Calculator },
    { id: "visualize", label: "Visualize", icon: LineChart },
    { id: "practice", label: "Practice", icon: GraduationCap }
  ];

  const activeTabIndex = tabs.findIndex(t => t.id === activeTabId);

  const handlePrev = () => {
    if (activeTabIndex > 0) setActiveTabId(tabs[activeTabIndex - 1].id);
  };

  const handleNext = () => {
    if (activeTabIndex < tabs.length - 1) setActiveTabId(tabs[activeTabIndex + 1].id);
  };

  const renderTabContent = () => {
    if (!activeSelectedFormula) return null;
    switch(activeTabId) {
      case "anatomy":
        return <FormulaAnatomy formula={activeSelectedFormula} mode="variables" />;
      case "solve":
        return <FormulaPlayground formula={activeSelectedFormula} values={values} setValues={setValues} />;
      case "visualize":
        return <FormulaGraph formula={activeSelectedFormula} values={values} />;
      case "practice":
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
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      {/* Premium SaaS Header */}
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/10 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">EduSim Laboratory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">Formula Lab</h1>
          <div className="text-xs text-slate-400 font-medium">
            {topic} • {subject || ""} {classId ? `• Class ${classId}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/5 bg-slate-950/40 px-4 py-2 text-xs font-semibold text-slate-300">
            Detected Formulas: <span className="text-violet-400 font-bold">{activeCount}</span>
          </div>
        </div>
      </header>

      <ErrorBoundary fallback={fallbackCard}>
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          
          {/* LEFT COLUMN: Directory Sidebar */}
          <aside className="rounded-3xl border border-white/10 bg-slate-900/15 p-5 backdrop-blur-md space-y-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search formulas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all text-slate-200 placeholder:text-slate-500"
              />
            </div>

            {/* List Selection Tabs */}
            <div className="flex border-b border-slate-800 pb-2 gap-4">
              <button
                onClick={() => { setActiveListTab("all"); setSelectedCategory("All"); }}
                className={`text-xs font-bold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeListTab === "all"
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                All Formulas
              </button>
              <button
                onClick={() => setActiveListTab("recent")}
                className={`text-xs font-bold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeListTab === "recent"
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Recent
              </button>
              <button
                onClick={() => setActiveListTab("saved")}
                className={`text-xs font-bold pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeListTab === "saved"
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Saved
              </button>
            </div>

            {/* Category Pills (rendered only for "all" formulas) */}
            {activeListTab === "all" && categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all border ${
                      selectedCategory === cat
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                        : "bg-slate-950/20 border-slate-900 text-slate-400 hover:border-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Formulas List Grid */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredFormulas.length > 0 ? (
                filteredFormulas.map((f, idx) => {
                  const isSelected = activeSelectedFormula?.id === f.id || activeSelectedFormula?.raw === f.raw;
                  const title = f.title || f.displayFormula || f.formula || f.raw || "Formula";
                  const category = getFormulaCategory(f);

                  return (
                    <div
                      key={f.id || f.raw}
                      onClick={() => {
                        selectFormula(f.id || f.raw);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 flex flex-col gap-3 relative overflow-hidden group ${
                        isSelected
                          ? "border-violet-500 bg-violet-600/[0.03] shadow-[0_0_20px_rgba(139,92,246,0.06)]"
                          : "border-slate-900 bg-slate-950/20 hover:bg-slate-900/30 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">
                            {category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-200 group-hover:text-slate-100 transition-colors line-clamp-1">{title}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveFormula(f.id || f.raw);
                          }}
                          className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${
                            savedIds.includes(f.id || f.raw) ? "text-yellow-400" : "text-slate-500 hover:text-yellow-400"
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${savedIds.includes(f.id || f.raw) ? "fill-yellow-400" : ""}`} />
                        </button>
                      </div>

                      {/* Formula latex centered card */}
                      <div className="py-2.5 px-3 bg-slate-950/40 rounded-xl border border-slate-900 shadow-inner overflow-x-auto text-center font-mono text-xs text-violet-300">
                        {f.latex || f.formula ? (
                          <BlockMath math={f.latex || f.formula} />
                        ) : (
                          <span className="text-[10px] text-slate-500">No formula preview</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-400 leading-normal line-clamp-2 pr-4 font-light">
                          {f.description || "Interactive dynamic equation analysis."}
                        </p>
                        <button
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                            isSelected ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No formulas found matching filters.
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: Operations Workspace */}
          <main className="space-y-6">
            {activeSelectedFormula ? (
              <div className="space-y-6">
                
                {/* Active Selected Formula Details Header */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-3xl -z-10" />
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/15">
                        {getFormulaCategory(activeSelectedFormula)}
                      </span>
                      {subject && (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {subject}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-100">
                      {activeSelectedFormula.title || "Formula Analyzer"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                      {activeSelectedFormula.description || "Detailed dynamic calculations and visualizations."}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSaveFormula(activeSelectedFormula.id || activeSelectedFormula.raw)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold ${
                      savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw)
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300"
                        : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                    <span>
                      {savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw) ? "Saved" : "Save Formula"}
                    </span>
                  </button>
                </div>

                {/* Operations Tabs Navigation */}
                <div className="flex items-center justify-between w-full rounded-2xl border border-white/5 bg-slate-950/40 p-1.5 shadow-inner overflow-x-auto">
                  <div className="flex items-center gap-1">
                    {tabs.map((tab) => {
                      const isActive = activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTabId(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                            isActive
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-700/25 scale-[1.02]"
                              : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3">
                    Step {activeTabIndex + 1} of 4
                  </div>
                </div>

                {/* Main Operations Interactive Screen */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTabId + "-" + activeSelectedFormula.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[350px]"
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    onClick={handlePrev}
                    disabled={activeTabIndex === 0}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-900 bg-slate-950/40 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900 transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  
                  <Link
                    to="/sandbox/default"
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Create Simulation
                  </Link>

                  <button
                    onClick={handleNext}
                    disabled={activeTabIndex === tabs.length - 1}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-slate-900/15 p-12 text-center text-slate-400">
                <Compass className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300">Select a formula</h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  Choose a formula from the directory on the left to start analyzing it.
                </p>
              </div>
            )}
          </main>

        </div>
      </ErrorBoundary>
    </div>
  );
};

export default FormulaLabPage;
