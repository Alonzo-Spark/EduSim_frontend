import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageWrapper } from "@/components/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  PlayCircle, 
  Link2, 
  Download, 
  Star, 
  Clock, 
  Filter, 
  Atom, 
  FlaskConical, 
  Calculator,
  ChevronRight,
  Trash2,
  Sparkles
} from "lucide-react";
import { useSavedSimulations } from "@/hooks/useSavedSimulations";
import type { SavedSimulation } from "@/types/saved-simulation";
import { DynamicSimulationRenderer } from "@/components/simulation-runtime/DynamicSimulationRenderer";

export const Route = createFileRoute("/my-simulations")({
  component: MySimulationsPage,
});

function MySimulationsPage() {
  const { simulations, deleteSimulation, toggleFavorite } = useSavedSimulations();
  const [active, setActive] = useState<SavedSimulation | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filteredSimulations = useMemo(() => {
    return simulations.filter((sim) => {
      const simTitle = sim.title || "";
      const simSubject = sim.subject || "";
      
      const matchesSearch = simTitle.toLowerCase().includes(search.toLowerCase()) || 
                            simSubject.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === "all" || 
        (filter === "favorites" && sim.favorite) ||
        (filter === "physics" && simSubject.toLowerCase() === "physics") ||
        (filter === "chemistry" && simSubject.toLowerCase() === "chemistry") ||
        (filter === "math" && simSubject.toLowerCase() === "math");

      return matchesSearch && matchesFilter;
    });
  }, [simulations, search, filter]);

  const handleShare = async () => {
    if (!active?.id) return;
    const shareUrl = `${window.location.origin}/my-simulations?id=${active.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share URL copied to clipboard!");
    } catch {
      alert("Failed to copy share URL.");
    }
  };

  const handleExport = () => {
    if (!active) return;
    const blob = new Blob(
      [typeof active.simulation === "string" ? active.simulation : JSON.stringify(active.simulation, null, 2)],
      { type: active.type === "html" ? "text/html" : "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title}.${active.type === "html" ? "html" : "json"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "physics": return <Atom className="w-4 h-4" />;
      case "chemistry": return <FlaskConical className="w-4 h-4" />;
      case "math": return <Calculator className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">My Simulations</h1>
          <p className="text-sm text-muted-foreground">
            Manage and explore your personal library of AI-generated scientific simulations.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
          {/* Left Panel: Library Sidebar */}
          <div className="glass-strong rounded-3xl p-4 flex flex-col gap-4 h-[calc(100vh-280px)] min-h-[600px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search simulations..."
                className="pl-9 bg-secondary/50 border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                { id: "all", label: "All", icon: <Filter className="w-3 h-3" /> },
                { id: "favorites", label: "Favorites", icon: <Star className="w-3 h-3" /> },
                { id: "physics", label: "Physics", icon: <Atom className="w-3 h-3" /> },
                { id: "chemistry", label: "Chemistry", icon: <FlaskConical className="w-3 h-3" /> },
                { id: "math", label: "Math", icon: <Calculator className="w-3 h-3" /> },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    filter === f.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-secondary/50 text-muted-foreground border border-border hover:border-primary/30"
                  }`}
                >
                  {f.icon}
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredSimulations.length > 0 ? (
                filteredSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => setActive(sim)}
                    className={`group relative w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                    active?.id === sim.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/20 hover:border-primary/30 hover:bg-secondary/50"
                  }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[var(--neon-cyan)] opacity-70">
                            {getSubjectIcon(sim.subject)}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {sim.subject}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm truncate text-foreground">{sim.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(sim.createdAt).toLocaleDateString()} • {sim.type.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(sim.id);
                          }}
                          className={`p-1.5 rounded-lg border border-border ${
                            sim.favorite ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" fill={sim.favorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSimulation(sim.id);
                            if (active?.id === sim.id) setActive(null);
                          }}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 border border-border">
                    <Search className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No simulations found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>

            <Link
              to="/tutor"
              className="mt-2 flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 border border-[var(--neon-purple)]/30 text-[var(--neon-cyan)] font-bold text-sm hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              Generate New
            </Link>
          </div>

          {/* Right Panel: Renderer */}
          <div className="glass-strong rounded-3xl p-4 flex flex-col gap-4">
            {active ? (
              <>
                <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-bold uppercase tracking-wider">
                        {active.subject}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{active.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(active.id)}
                      className={`p-2 rounded-xl border transition-all ${
                        active.favorite
                          ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                          : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Star className="w-4 h-4" fill={active.favorite ? "currentColor" : "none"} />
                    </button>
                    <Link 
                      to="/sandbox/$simulationId" 
                      params={{ simulationId: active.id }}
                    >
                      <Button size="sm" className="rounded-xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-[var(--neon-purple)]/20 gap-2 cursor-pointer">
                        <Sparkles className="w-4 h-4" /> Launch Sandbox
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={handleShare}>
                      <Link2 className="w-4 h-4 mr-1" /> Share
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-[520px]">
                  <DynamicSimulationRenderer
                    dsl={active.type === "dsl" ? active.simulation : undefined}
                    html={active.type === "html" ? active.simulation : undefined}
                    title={active.title}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 border border-border shadow-2xl">
                  <PlayCircle className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">No simulation selected</h2>
                <p className="text-muted-foreground max-w-sm mb-8">
                  {simulations.length > 0 
                    ? "Select a simulation from your library to interact with it."
                    : "You haven't generated any simulations yet. Start by creating one with the AI Agent."}
                </p>
                {simulations.length === 0 && (
                  <Link
                    to="/tutor"
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-bold shadow-lg glow-purple hover:scale-105 transition-transform"
                  >
                    <Sparkles className="w-5 h-5" />
                    Go to Tutor
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
export function Stub(title: string, subtitle: string) {
  return (
    <PageWrapper>
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </PageWrapper>
  );
}
