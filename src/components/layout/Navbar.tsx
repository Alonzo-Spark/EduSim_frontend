import { Bell, Flame, Zap, LogOut, Brain } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { USER } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { user, signOut } = useAuth();

  const xp = USER.xp;
  const streak = USER.streak;
  const name = user?.email ?? USER.name;
  const initials = (name || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/70 backdrop-blur-xl px-4 md:px-8 py-3 select-none">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-glow to-indigo-glow">
          <Brain className="h-4 w-4 text-background" />
        </div>
        <span className="gradient-text font-display">EduSim</span>
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-glow/30 bg-amber-glow/10 px-3 py-1.5 text-xs font-semibold text-amber-glow">
          <Flame className="h-3.5 w-3.5" />
          {streak} day streak
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-indigo-glow/30 bg-indigo-glow/10 px-3 py-1.5 text-xs font-semibold text-indigo-glow">
          <Zap className="h-3.5 w-3.5" />
          {xp.toLocaleString()} XP
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full border border-border/70 hover:bg-white/5 transition cursor-pointer">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-glow to-indigo-glow text-xs font-bold text-background select-none">
          {initials}
        </div>
        <button
          onClick={() => signOut()}
          title="Sign out"
          className="grid h-9 w-9 place-items-center rounded-full border border-border/70 hover:bg-white/5 transition cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
