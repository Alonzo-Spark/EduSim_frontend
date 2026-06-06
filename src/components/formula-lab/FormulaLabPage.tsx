import React, { useEffect, useState, useMemo } from "react";
import { useFormulaLab } from "@/hooks/useFormulaLab";
import { DynamicFormulaExtractor, DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { physicsSimulationApi } from "@/services/physicsSimulationApi";
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
import { BlockMath } from "@/components/math/Katex";
import "katex/dist/katex.min.css";

interface Props {
  topic: string;
  classId?: string;
  subject?: string;
  chapter?: string;
  ragContent?: string;
  formulas?: DynamicParsedFormula[] | null;
  isInline?: boolean;
  formulaExpression?: string;
  formulaMeaning?: string;
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
  isInline = false,
  formulaExpression,
  formulaMeaning,
}) => {
  const { formulas, selectedFormula, selectFormula, loadForTopic } = useFormulaLab();

  const [localFormulas, setLocalFormulas] = useState<DynamicParsedFormula[] | null>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);

  const activeFormulas = localFormulas || directFormulas || formulas;
  const activeCount = activeFormulas ? activeFormulas.length : 0;

  const activeSelectedFormula = localFormulas
    ? (localFormulas[localSelectedIndex] || null)
    : (directFormulas && directFormulas.length > 0 ? directFormulas[localSelectedIndex] : selectedFormula);

  const handleSelectFormula = (raw: string) => {
    if (localFormulas) {
      const idx = localFormulas.findIndex(f => f.id === raw || f.raw === raw);
      if (idx >= 0) setLocalSelectedIndex(idx);
    } else if (directFormulas) {
      const idx = directFormulas.findIndex(f => f.id === raw || f.raw === raw);
      if (idx >= 0) setLocalSelectedIndex(idx);
    } else {
      selectFormula(raw);
    }
  };

  const handleSearchAi = async (queryToSearch?: string) => {
    const q = queryToSearch || searchQuery;
    if (!q.trim()) return;

    setIsSearchingAi(true);
    setAiSearchError(null);
    try {
      const response = await physicsSimulationApi.queryRag(q);
      const rag = response.success && response.data ? response.data.answer : "";

      const parsed = await DynamicFormulaExtractor.parseTutorResponse(
        rag,
        q,
        subject || "physics",
        classId
      );

      if (parsed && parsed.length > 0) {
        setLocalFormulas(parsed);
        setLocalSelectedIndex(0);
        setSearchQuery(""); // Clear input to show results
      } else {
        setAiSearchError(`Could not find equations for "${q}". Try asking for "Newton's Second Law", "Ohm's Law", or "Kinetic Energy".`);
      }
    } catch (err) {
      console.error("AI Search in Formula Lab failed:", err);
      setAiSearchError("Failed to connect to the AI Tutor.");
    } finally {
      setIsSearchingAi(false);
    }
  };

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
      loadForTopic({ topic, classId, subject, chapter, ragContent, formulaExpression, formulaMeaning });
    }
  }, [topic, classId, subject, chapter, ragContent, loadForTopic, directFormulas, formulaExpression, formulaMeaning]);

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
    if (isInline) {
      return (
        <div className="w-full rounded-[2rem] border border-slate-100 bg-white/80 p-12 shadow-sm flex flex-col items-center justify-center min-h-[280px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
            <span className="text-sm text-slate-500 font-bold tracking-wider animate-pulse">Analyzing textbook formulas...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full mx-auto space-y-6 animate-pulse p-4 md:p-6">
        {/* Header Skeleton */}
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded-full" />
            <div className="h-8 w-48 bg-slate-300 rounded-xl" />
            <div className="h-3 w-64 bg-slate-200 rounded-full" />
          </div>
          <div className="h-8 w-36 bg-slate-200 rounded-full" />
        </header>

        {/* Directory & Workspace Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] 2xl:grid-cols-[380px_1fr] gap-6 items-start">
          <aside className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm space-y-5 hidden xl:block">
            <div className="h-10 bg-slate-200 rounded-xl w-full" />
            <div className="flex gap-4 border-b border-slate-100 pb-2">
              <div className="h-4 w-24 bg-slate-200 rounded-full" />
              <div className="h-4 w-16 bg-slate-200 rounded-full" />
              <div className="h-4 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="border border-slate-100 bg-white rounded-2xl p-4 space-y-3">
                  <div className="h-3 w-16 bg-slate-200 rounded-full" />
                  <div className="h-5 w-40 bg-slate-350 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          </aside>

          <main className="rounded-3xl border border-slate-100 bg-white/80 p-6 min-h-[500px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
              <span className="text-sm text-slate-500 font-bold tracking-wider animate-pulse">Analyzing textbook formulas...</span>
            </div>
          </main>
        </div>
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
    switch (activeTabId) {
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
    <div className={`w-full max-w-[1600px] mx-auto space-y-6 ${isInline ? "px-0 py-2" : "p-4 md:p-6"}`}>
      {/* Premium SaaS Header */}
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/85 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl md:flex-row md:items-center md:justify-between transition-all duration-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">EduSim Laboratory</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Formula Lab</h1>
          <div className="text-xs text-slate-500 font-semibold">
            {localFormulas ? `AI Search: "${localFormulas[0]?.topic || topic}"` : (topic === "new" ? "New Workspace" : topic)} • <span className="capitalize">{subject || "physics"}</span> {classId ? `• Class ${classId}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-inner">
            Detected Formulas: <span className="text-violet-600 font-extrabold">{activeCount}</span>
          </div>
        </div>
      </header>

      <ErrorBoundary fallback={fallbackCard}>
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] 2xl:grid-cols-[380px_1fr] gap-6 items-start">

          {/* LEFT COLUMN: Directory Sidebar */}
          <aside className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md space-y-5">
            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search formulas or ask AI..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleSearchAi();
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery.trim() && (
                  <button
                    onClick={() => handleSearchAi()}
                    title="Query AI for matching formulas"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </button>
                )}
              </div>
            </div>

            {aiSearchError && (
              <div className="p-3.5 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-xs leading-relaxed font-medium">
                {aiSearchError}
              </div>
            )}

            {/* List Selection Tabs */}
            <div className="flex border-b border-slate-100 pb-2 gap-4">
              <button
                onClick={() => { setActiveListTab("all"); setSelectedCategory("All"); }}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all flex items-center gap-1.5 ${activeListTab === "all"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                <Compass className="w-3.5 h-3.5" />
                All Formulas
              </button>
              <button
                onClick={() => setActiveListTab("recent")}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all flex items-center gap-1.5 ${activeListTab === "recent"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                <History className="w-3.5 h-3.5" />
                Recent
              </button>
              <button
                onClick={() => setActiveListTab("saved")}
                className={`text-xs font-bold pb-1.5 border-b-2 transition-all flex items-center gap-1.5 ${activeListTab === "saved"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
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
                    className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all border ${selectedCategory === cat
                      ? "bg-violet-50 border-violet-200 text-violet-700 font-extrabold"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Formulas List Grid */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {isSearchingAi ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-600 rounded-full animate-spin" />
                  <span className="text-xs text-slate-400 font-bold tracking-wider animate-pulse">Querying AI Tutor for formulas...</span>
                </div>
              ) : filteredFormulas.length > 0 ? (
                filteredFormulas.map((f, idx) => {
                  const isSelected = activeSelectedFormula?.id === f.id || activeSelectedFormula?.raw === f.raw;
                  const title = f.title || f.displayFormula || f.formula || f.raw || "Formula";
                  const category = getFormulaCategory(f);

                  return (
                    <div
                      key={f.id || f.raw}
                      onClick={() => {
                        handleSelectFormula(f.id || f.raw);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left cursor-pointer transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group ${isSelected
                        ? "border-violet-500 bg-violet-50/20 shadow-[0_4px_20px_rgba(139,92,246,0.05)] scale-[1.01]"
                        : "border-slate-100 bg-white hover:bg-slate-50/30 hover:border-slate-200 hover:shadow-md"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                            {category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors line-clamp-1">{title}</h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveFormula(f.id || f.raw);
                          }}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${savedIds.includes(f.id || f.raw) ? "text-yellow-500" : "text-slate-400 hover:text-yellow-500"
                            }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${savedIds.includes(f.id || f.raw) ? "fill-yellow-500" : ""}`} />
                        </button>
                      </div>

                      {/* Formula latex centered card */}
                      <div className="py-2.5 px-3 bg-gradient-to-br from-violet-500/[0.03] to-indigo-500/[0.03] rounded-xl border border-violet-500/10 shadow-inner overflow-x-auto text-center font-mono text-xs text-violet-700">
                        {f.latex || f.formula ? (
                          <BlockMath math={f.latex || f.formula || ""} />
                        ) : (
                          <span className="text-[10px] text-slate-400">No formula preview</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 pr-4 font-normal">
                          {f.description || "Interactive dynamic equation analysis."}
                        </p>
                        <button
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors shrink-0 ${isSelected ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"
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
                <div className="py-12 text-center text-slate-400 text-xs space-y-4">
                  <p>{topic === "new" && !localFormulas && !searchQuery ? "Enter a topic in the search bar above to generate formulas." : "No formulas found matching filters."}</p>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => handleSearchAi()}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white/80" />
                      <span>Search AI for "{searchQuery}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: Operations Workspace */}
          <main className="space-y-6">
            {activeSelectedFormula ? (
              <div className="space-y-6">

                {/* Active Selected Formula Details Header */}
                <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/[0.03] blur-3xl -z-10" />
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">
                        {getFormulaCategory(activeSelectedFormula)}
                      </span>
                      {subject && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {subject}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-850">
                      {activeSelectedFormula.title || "Formula Analyzer"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                      {activeSelectedFormula.description || "Detailed dynamic calculations and visualizations."}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSaveFormula(activeSelectedFormula.id || activeSelectedFormula.raw)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold ${savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw)
                      ? "bg-yellow-50 border-yellow-100 text-yellow-700 shadow-sm"
                      : "bg-slate-50 border-slate-200/80 text-slate-500 hover:border-slate-350 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw) ? "fill-yellow-500 text-yellow-550" : ""}`} />
                    <span>
                      {savedIds.includes(activeSelectedFormula.id || activeSelectedFormula.raw) ? "Saved" : "Save Formula"}
                    </span>
                  </button>
                </div>

                {/* Operations Tabs Navigation */}
                <div className="flex items-center justify-between w-full rounded-2xl border border-slate-100/85 bg-slate-50/80 p-1.5 shadow-inner overflow-x-auto">
                  <div className="flex items-center gap-1">
                    {tabs.map((tab) => {
                      const isActive = activeTabId === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTabId(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${isActive
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/15 scale-[1.01]"
                            : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                            }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-100 gap-3">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-3 order-1 sm:order-1">
                    <button
                      onClick={handlePrev}
                      disabled={activeTabIndex === 0}
                      className="flex-1 sm:flex-initial flex h-10 items-center justify-center gap-1.5 px-5 rounded-full border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-600 hover:text-slate-850 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={activeTabIndex === tabs.length - 1}
                      className="flex-1 sm:flex-initial flex h-10 items-center justify-center gap-1.5 px-5 rounded-full bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-md shadow-violet-600/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to="/sandbox/$simulationId"
                    params={{ simulationId: "default" }}
                    search={{
                      query: activeSelectedFormula?.title ? `Explain ${activeSelectedFormula.title}` : "Physics Simulation",
                    }}
                    className="w-full sm:w-auto flex h-10 items-center justify-center gap-1.5 px-6 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-md shadow-violet-600/10 transition-all cursor-pointer whitespace-nowrap order-2 sm:order-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Create Simulation
                  </Link>
                </div>

              </div>
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white/80 p-12 text-center text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <Compass className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-300">Select a Formula or Query AI</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  Choose a formula from the directory on the left to start analyzing it, or use the search bar above to query the AI Tutor for matching equations.
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
