import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  BookOpen,
  BrainCircuit,
  FlaskConical,
  TrendingUp,
  Trophy,
  BarChart3,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CURRICULUM } from "@/data/curriculum";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "AI Tutor", icon: BrainCircuit, href: "/chat" },
  { label: "Simulations", icon: FlaskConical, href: "/simulations" },
  { label: "Progress", icon: TrendingUp, href: "/progress" },
  { label: "Achievements", icon: Trophy, href: "/achievements" },
  { label: "Leaderboard", icon: BarChart3, href: "/leaderboard" },
  { label: "Settings", icon: Settings, href: "/settings" },
] as const;

export function Sidebar() {
  const { location } = useRouterState();
  const [classesOpen, setClassesOpen] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string | null>(CURRICULUM[0]?.id ?? null);

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col gap-1 border-r border-border/60 bg-surface/40 backdrop-blur-xl px-3 py-5">
      <Link to="/" className="flex items-center gap-2 px-2 pb-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-glow to-purple-glow shadow-glow-indigo">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="font-display text-lg font-bold tracking-tight">
          Edu<span className="gradient-text">Sim</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5 scrollbar-thin overflow-y-auto pr-1">
        {navItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-foreground shadow-glow-indigo border border-border-glow"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-indigo-glow")} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-glow animate-pulse-glow" />}
            </Link>
          );
        })}

        <button
          onClick={() => setClassesOpen(!classesOpen)}
          className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
        >
          <BookOpen className="h-4 w-4" />
          Classes
          <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", classesOpen && "rotate-90")} />
        </button>
        {classesOpen && (
          <div className="ml-3 mt-1 border-l border-border/80 pl-3 flex flex-col gap-1">
            {CURRICULUM.map((schoolClass) => {
              const isActive = activeClassId === schoolClass.id;
              return (
                <div key={schoolClass.id} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveClassId(isActive ? null : schoolClass.id)}
                    className={cn(
                      "flex items-center rounded-md px-2.5 py-1.5 text-xs transition text-left",
                      isActive
                        ? "text-foreground bg-white/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                    )}
                  >
                    {schoolClass.name}
                    <ChevronRight className={cn("ml-auto h-3.5 w-3.5 transition-transform", isActive && "rotate-90")} />
                  </button>

                  {isActive && (
                    <div className="ml-3 border-l border-border/60 pl-3 flex flex-col gap-0.5">
                      {schoolClass.subjects.map((subject) => (
                        <div key={subject.id} className="flex flex-col gap-0.5">
                          <Link
                            to="/chat"
                            className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
                          >
                            {subject.name}
                          </Link>
                          <div className="ml-2.5 flex flex-col gap-0.5">
                            {(Array.isArray(subject.chapters) ? subject.chapters.slice(0, 3) : []).map((chapter) => (
                              <Link
                                key={chapter.id}
                                to="/chat"
                                className="rounded-md px-2 py-1 text-[10px] text-muted-foreground/80 hover:text-foreground hover:bg-white/5 transition"
                              >
                                {chapter.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      <div className="mt-auto rounded-xl glow-card p-3 text-xs">
        <div className="font-display font-semibold text-foreground">Pro tip</div>
        <div className="text-muted-foreground mt-1">
          Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘K</kbd> to search anywhere.
        </div>
      </div>
    </aside>
  );
}
