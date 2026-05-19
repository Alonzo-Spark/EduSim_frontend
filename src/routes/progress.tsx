import { createFileRoute } from "@tanstack/react-router";
import { Brain, FlaskConical, BookOpen, Flame } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { WEEKLY_ACTIVITY } from "@/lib/mock-data";
import { CURRICULUM } from "@/data/curriculum";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
  head: () => ({
    meta: [
      { title: "Progress — EduSim" },
      { name: "description", content: "Your weekly activity, subject breakdown and chapter completion." },
    ],
  }),
});

const ACCENT: Record<string, string> = {
  indigo: "from-indigo-glow/40 to-indigo-glow/0 text-indigo-glow",
  cyan: "from-cyan-glow/40 to-cyan-glow/0 text-cyan-glow",
  purple: "from-purple-glow/40 to-purple-glow/0 text-purple-glow",
  amber: "from-amber-glow/40 to-amber-glow/0 text-amber-glow",
};

const chapters = CURRICULUM.flatMap((schoolClass) =>
  schoolClass.subjects.flatMap((subject) =>
    (Array.isArray(subject.chapters) ? subject.chapters : []).map((chapter, index) => ({
      name: chapter.name,
      completion: Math.max(18, 96 - index * 8 - schoolClass.name.length),
    })),
  ),
).slice(0, 10);

const subjectBreakdown = CURRICULUM.flatMap((schoolClass) => schoolClass.subjects).slice(0, 4).map((subject, index) => ({
  name: subject.name,
  value: Math.max(12, Array.isArray(subject.chapters) ? subject.chapters.reduce((count, chapter) => count + chapter.topics.length, 0) : subject.chapters),
  color: ["var(--indigo-glow)", "var(--cyan-glow)", "var(--emerald-glow)", "var(--purple-glow)"][index % 4],
}));

function ProgressPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Progress Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your learning journey, visualized.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "Topics Learned", value: 42, color: "indigo" },
            { icon: FlaskConical, label: "Simulations Run", value: 18, color: "cyan" },
            { icon: BookOpen, label: "Subjects Explored", value: 4, color: "purple" },
            { icon: Flame, label: "Day Streak", value: "7 🔥", color: "amber" },
          ].map((s) => (
            <div key={s.label} className="glow-card p-5">
              <div className={cn("inline-grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br", ACCENT[s.color])}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="mt-3 text-2xl font-bold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 glow-card p-5">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="font-semibold">Weekly Activity</h2>
                <p className="text-xs text-muted-foreground">Simulations vs topics studied</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={WEEKLY_ACTIVITY}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--indigo-glow)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--indigo-glow)" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cyan-glow)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--cyan-glow)" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,40,0.95)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="simulations" fill="url(#grad1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="topics" fill="url(#grad2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glow-card p-5">
            <h2 className="font-semibold mb-2">Subject Breakdown</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={subjectBreakdown}
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {subjectBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,40,0.95)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glow-card p-5">
          <h2 className="font-semibold mb-4">Chapter Completion Map</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {chapters.map((ch) => {
              const color =
                ch.completion > 80 ? "emerald" : ch.completion > 40 ? "amber" : "purple";
              return (
                <div
                  key={ch.name}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-4",
                    color === "emerald" && "border-emerald-glow/40 bg-emerald-glow/5",
                    color === "amber" && "border-amber-glow/40 bg-amber-glow/5",
                    color === "purple" && "border-purple-glow/40 bg-purple-glow/5",
                  )}
                >
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 h-1 transition-all",
                      color === "emerald" && "bg-emerald-glow",
                      color === "amber" && "bg-amber-glow",
                      color === "purple" && "bg-purple-glow",
                    )}
                    style={{ width: `${ch.completion}%` }}
                  />
                  <div className="text-xs text-muted-foreground">Chapter</div>
                  <div className="font-semibold mt-0.5 line-clamp-1">{ch.name}</div>
                  <div
                    className={cn(
                      "mt-2 text-lg font-bold font-display",
                      color === "emerald" && "text-emerald-glow",
                      color === "amber" && "text-amber-glow",
                      color === "purple" && "text-purple-glow",
                    )}
                  >
                    {ch.completion}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
