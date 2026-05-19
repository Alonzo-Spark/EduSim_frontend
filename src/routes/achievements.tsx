import { createFileRoute } from "@tanstack/react-router";
import {
  FlaskConical, BookOpen, Flame, Trophy, Zap, Star, Telescope, Lightbulb,
  Rocket, Dna, Atom, Crown, Lock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { USER, BADGES, CHALLENGES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  component: AchievementsPage,
  head: () => ({
    meta: [
      { title: "Achievements — EduSim" },
      { name: "description", content: "Badges, levels and active challenges that keep you motivated." },
    ],
  }),
});

const ICONS = { FlaskConical, BookOpen, Flame, Trophy, Zap, Star, Telescope, Lightbulb, Rocket, Dna, Atom, Crown };

const RARITY: Record<string, { ring: string; text: string; bg: string }> = {
  common:    { ring: "border-cyan-glow/40",    text: "text-cyan-glow",    bg: "from-cyan-glow/15 to-transparent" },
  rare:      { ring: "border-indigo-glow/50",  text: "text-indigo-glow",  bg: "from-indigo-glow/20 to-transparent" },
  legendary: { ring: "border-amber-glow/60",   text: "text-amber-glow",   bg: "from-amber-glow/25 to-transparent" },
};

function AchievementsPage() {
  const pct = (USER.xp / USER.nextLevelXp) * 100;
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display">Achievements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Level up, unlock badges, conquer challenges.
          </p>
        </div>

        {/* Level banner */}
        <div className="relative overflow-hidden rounded-3xl glow-border p-6 md:p-8">
          <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-amber-glow/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-purple-glow/20 blur-3xl" />
          <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-amber-glow/60 bg-gradient-to-br from-amber-glow/30 to-purple-glow/30 shadow-glow-purple">
              <div className="text-4xl font-bold font-display gradient-text">L{USER.level}</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background border border-amber-glow/60 px-2 py-0.5 text-[10px] font-semibold text-amber-glow">
                LEVEL
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground">Knowledge Apprentice</div>
              <div className="text-xl font-bold font-display mt-0.5">
                {USER.xp.toLocaleString()} / {USER.nextLevelXp.toLocaleString()} XP
              </div>
              <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-glow via-purple-glow to-amber-glow shimmer"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {USER.nextLevelXp - USER.xp} XP until <b className="text-foreground">Level {USER.level + 1}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold font-display">Badges</h2>
            <span className="text-xs text-muted-foreground">
              {BADGES.filter((b) => b.earned).length} / {BADGES.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {BADGES.map((b) => {
              const Icon = ICONS[b.icon as keyof typeof ICONS] ?? Trophy;
              const r = RARITY[b.rarity];
              return (
                <div
                  key={b.title}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all",
                    b.earned ? r.ring : "border-border/40 opacity-50",
                    b.earned && "hover:scale-[1.02]",
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br", b.earned ? r.bg : "from-white/0")} />
                  <div className="relative">
                    <div
                      className={cn(
                        "grid h-14 w-14 place-items-center rounded-2xl border",
                        b.earned ? r.ring : "border-border/50",
                      )}
                    >
                      {b.earned ? (
                        <Icon className={cn("h-7 w-7", r.text)} />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3 font-semibold">{b.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{b.desc}</div>
                    <div
                      className={cn(
                        "mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border",
                        b.earned ? cn(r.ring, r.text) : "border-border/50 text-muted-foreground",
                      )}
                    >
                      {b.rarity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Challenges */}
        <div>
          <h2 className="text-lg font-semibold font-display mb-3">Active Challenges</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {CHALLENGES.map((c) => (
              <div key={c.title} className="glow-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{c.title}</div>
                  <div className="rounded-full bg-amber-glow/10 border border-amber-glow/40 px-2 py-0.5 text-[10px] text-amber-glow font-semibold">
                    +{c.xp} XP
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
                <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-glow to-purple-glow"
                    style={{ width: `${(c.progress / c.total) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {c.progress}/{c.total}
                  </span>
                  <span className="text-amber-glow">{c.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
