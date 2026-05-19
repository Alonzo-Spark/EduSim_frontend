import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LEADERBOARD } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard — EduSim" },
      { name: "description", content: "See where you rank against learners across India." },
    ],
  }),
});

const TABS = ["Weekly", "All Time", "By Subject"];

function LeaderboardPage() {
  const [tab, setTab] = useState("Weekly");
  const sorted = [...LEADERBOARD].sort((a, b) => b.xp - a.xp);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top learners climbing the knowledge ladder.
          </p>
        </div>

        <div className="flex gap-1 rounded-xl border border-border-glow/50 bg-surface/40 p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 text-sm rounded-lg transition",
                tab === t ? "bg-indigo-glow/20 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end">
          {[1, 0, 2].map((podiumIdx) => {
            const u = top3[podiumIdx];
            const rank = podiumIdx + 1;
            const heights = ["h-44", "h-56", "h-36"];
            const colors = [
              "from-slate-300/30 to-slate-500/20 border-slate-300/40 text-slate-200",
              "from-amber-glow/40 to-purple-glow/20 border-amber-glow/60 text-amber-glow",
              "from-orange-400/30 to-amber-700/20 border-orange-400/40 text-orange-300",
            ];
            const positionInArray = [1, 0, 2].indexOf(podiumIdx);
            return (
              <div key={u.name} className="flex flex-col items-center">
                <div className={cn("relative grid h-16 w-16 md:h-20 md:w-20 place-items-center rounded-full bg-gradient-to-br border-2 mb-3", colors[rank - 1])}>
                  <span className="font-bold font-display text-lg">{u.initials}</span>
                  {rank === 1 && (
                    <Crown className="absolute -top-4 h-5 w-5 text-amber-glow" />
                  )}
                </div>
                <div className="text-xs font-semibold text-center line-clamp-1">{u.name}</div>
                <div className="text-[11px] text-muted-foreground">{u.xp.toLocaleString()} XP</div>
                <div
                  className={cn(
                    "mt-3 w-full rounded-t-xl border-t border-x bg-gradient-to-b grid place-items-center",
                    heights[positionInArray],
                    colors[rank - 1],
                  )}
                >
                  <div className="text-3xl md:text-5xl font-bold font-display">#{rank}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="glow-card p-2 md:p-4">
          <div className="hidden md:grid grid-cols-[60px_1fr_120px_100px_100px] gap-4 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <div>Rank</div>
            <div>Learner</div>
            <div className="text-right">XP</div>
            <div className="text-right">Sims</div>
            <div className="text-right">Streak</div>
          </div>
          <div className="divide-y divide-border/40">
            {rest.map((u, i) => {
              const rank = i + 4;
              return (
                <div
                  key={u.name}
                  className={cn(
                    "grid grid-cols-[40px_1fr_auto] md:grid-cols-[60px_1fr_120px_100px_100px] gap-4 px-3 md:px-4 py-3 items-center text-sm transition rounded-lg",
                    u.isCurrent && "bg-indigo-glow/10 border border-indigo-glow/40 shadow-glow-indigo",
                  )}
                >
                  <div className="font-bold font-display text-muted-foreground">#{rank}</div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-glow to-purple-glow text-xs font-bold text-white shrink-0">
                      {u.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {u.name} {u.isCurrent && <span className="text-[10px] text-indigo-glow">(you)</span>}
                      </div>
                      <div className="md:hidden text-xs text-muted-foreground">
                        {u.xp.toLocaleString()} XP · {u.sims} sims
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-end gap-1.5 text-indigo-glow font-mono">
                    <Trophy className="h-3.5 w-3.5" /> {u.xp.toLocaleString()}
                  </div>
                  <div className="hidden md:block text-right font-mono text-muted-foreground">
                    {u.sims}
                  </div>
                  <div className="hidden md:flex items-center justify-end gap-1 text-amber-glow font-mono">
                    <Flame className="h-3.5 w-3.5" /> {u.streak}
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
