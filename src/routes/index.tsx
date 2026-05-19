import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calculator,
  Atom,
  Leaf,
  Sparkles,
  ArrowRight,
  Brain,
  FlaskConical,
  Zap,
  Flame,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CURRICULUM } from "@/data/curriculum";
import {
  USER,
  CONTINUE_LEARNING,
} from "@/lib/mock-data";
import { getRecommendedTopics } from "@/lib/curriculum-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "EduSim — Learn, explore, simulate, master" },
      {
        name: "description",
        content:
          "Textbook-grounded AI tutor for Classes 1–10. Interactive explanations, formulas, quizzes and physics simulations.",
      },
    ],
  }),
});

const SUBJECT_ICONS = { Calculator, Atom, Leaf, Sparkles } as const;
const ACCENT_RING: Record<string, string> = {
  indigo: "from-indigo-glow/40 to-indigo-glow/0 text-indigo-glow",
  cyan: "from-cyan-glow/40 to-cyan-glow/0 text-cyan-glow",
  purple: "from-purple-glow/40 to-purple-glow/0 text-purple-glow",
  emerald: "from-emerald-glow/40 to-emerald-glow/0 text-emerald-glow",
  amber: "from-amber-glow/40 to-amber-glow/0 text-amber-glow",
};

function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const subjectCards = CURRICULUM.flatMap((schoolClass) =>
    schoolClass.subjects.map((subject) => ({
      key: `${schoolClass.id}-${subject.id}`,
      name: subject.name,
      desc: `${schoolClass.name} · ${Array.isArray(subject.chapters) ? subject.chapters.length : subject.chapters} chapters`,
      topics: Array.isArray(subject.chapters) ? subject.chapters.reduce((count, chapter) => count + chapter.topics.length, 0) : 0,
      accent: subject.id === "physics" ? "cyan" : subject.id === "biology" ? "emerald" : subject.id === "evs" ? "purple" : "indigo",
      icon: subject.id === "physics" ? "Atom" : subject.id === "biology" ? "Leaf" : "Calculator",
    })),
  ).slice(0, 4);

  const classCards = CURRICULUM.map((schoolClass, index) => ({
    id: index + 1,
    label: schoolClass.name,
    subjects: schoolClass.subjects.map((subject) => subject.name),
  }));

  const suggestedTopics = getRecommendedTopics(8).map((item) => item.topic);

  const go = () => navigate({ to: "/tutor" });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl flex flex-col gap-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl glow-border p-8 md:p-12">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-glow/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-cyan-glow/20 blur-3xl" />
          <div className="relative">
            <div className="text-sm text-muted-foreground">{greeting},</div>
            <h1 className="mt-1 text-3xl md:text-5xl font-bold tracking-tight">
              {USER.name} 👋
            </h1>
            <p className="mt-4 max-w-2xl text-lg md:text-2xl font-display">
              Learn. Explore. <span className="gradient-text">Simulate.</span> Master.
            </p>
            <p className="mt-2 text-muted-foreground">What do you want to learn today?</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                go();
              }}
              className="mt-6 flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Brain className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-glow" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ask anything… e.g. What is projectile motion?"
                  className="w-full rounded-2xl border border-border-glow bg-surface/70 backdrop-blur pl-12 pr-4 py-4 text-base outline-none focus:ring-2 focus:ring-ring/50 transition"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-glow to-purple-glow px-6 py-4 text-sm font-semibold text-white shadow-glow-indigo hover:opacity-95 transition"
              >
                Ask AI Tutor <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/simulations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-glow/40 bg-cyan-glow/10 px-6 py-4 text-sm font-semibold text-cyan-glow hover:bg-cyan-glow/20 transition"
              >
                <FlaskConical className="h-4 w-4" /> Explore Simulations
              </Link>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {suggestedTopics.map((t) => (
                <button
                  key={t}
                  onClick={go}
                  className="rounded-full border border-border/70 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:border-border-glow hover:text-foreground transition"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "Topics Learned", value: 42, color: "indigo" },
            { icon: FlaskConical, label: "Simulations Run", value: 18, color: "cyan" },
            { icon: Zap, label: "XP Earned", value: "1,240", color: "purple" },
            { icon: Flame, label: "Day Streak", value: `${USER.streak} 🔥`, color: "amber" },
          ].map((s) => (
            <div key={s.label} className="glow-card p-5">
              <div className={cn("inline-grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br", ACCENT_RING[s.color])}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-2xl font-bold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Continue learning */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold font-display">Continue where you left off</h2>
              <p className="text-sm text-muted-foreground">Pick up exactly where you stopped.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {CONTINUE_LEARNING.map((c) => (
              <Link to="/tutor" key={c.title} className="glow-card p-5 block group">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" /> {c.klass}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                <div className="text-xs text-muted-foreground">{c.chapter}</div>
                <div className="mt-4">
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        c.accent === "indigo" && "from-indigo-glow to-purple-glow",
                        c.accent === "cyan" && "from-cyan-glow to-indigo-glow",
                        c.accent === "emerald" && "from-emerald-glow to-cyan-glow",
                      )}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">{c.progress}% complete</span>
                    <span className="text-foreground group-hover:text-indigo-glow transition">
                      Resume →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Subjects */}
        <section>
          <h2 className="text-xl font-bold font-display mb-4">Explore by subject</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectCards.map((s) => {
              const Icon = SUBJECT_ICONS[s.icon as keyof typeof SUBJECT_ICONS];
              return (
                <Link to="/tutor" key={s.key} className="glow-card p-5 block group">
                  <div className={cn("inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br", ACCENT_RING[s.accent])}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-muted-foreground">
                      {s.topics} topics
                    </span>
                    <span className="text-indigo-glow group-hover:translate-x-0.5 transition">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Classes */}
        <section>
          <h2 className="text-xl font-bold font-display mb-4">Explore by class</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {classCards.map((c, i) => (
              <Link
                to="/tutor"
                key={c.id}
                className="relative overflow-hidden rounded-2xl glow-card p-4 text-center group"
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-25 group-hover:opacity-40 transition",
                    "bg-gradient-to-br",
                    i % 4 === 0 && "from-indigo-glow to-purple-glow",
                    i % 4 === 1 && "from-cyan-glow to-indigo-glow",
                    i % 4 === 2 && "from-emerald-glow to-cyan-glow",
                    i % 4 === 3 && "from-amber-glow to-purple-glow",
                  )}
                />
                <div className="relative">
                  <div className="text-3xl font-bold font-display">{c.id}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Class</div>
                  <div className="mt-3 text-[10px] text-muted-foreground line-clamp-1">
                    {c.subjects.join(" · ")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
