import { Skeleton } from "@/components/ui/skeleton";

export function TutorSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="glass-strong rounded-3xl p-8 space-y-4">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-5/6 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-3xl bg-white/5" />
        <Skeleton className="h-40 rounded-3xl bg-white/5" />
      </div>
      <div className="glass-strong rounded-3xl p-8 space-y-4">
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-4/6 bg-white/5" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-strong rounded-3xl overflow-hidden border border-white/5">
      <Skeleton className="aspect-video w-full bg-white/5" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-24 bg-white/5" />
        <Skeleton className="h-6 w-full bg-white/5" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-20 bg-white/5" />
          <Skeleton className="h-8 w-16 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function SimulationLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-[var(--neon-purple)]/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-[var(--neon-purple)] rounded-full animate-spin" />
      </div>
      <p className="text-[var(--neon-purple)] font-bold animate-pulse tracking-widest uppercase text-xs">
        Generating Quantum State...
      </p>
    </div>
  );
}
export function ChatTypingLoader() {
  return (
    <div className="flex gap-1 items-center px-4 py-2 bg-white/5 rounded-2xl w-fit border border-white/5">
      <div className="w-1.5 h-1.5 bg-[var(--neon-purple)] rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 bg-[var(--neon-purple)] rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 bg-[var(--neon-purple)] rounded-full animate-bounce" />
    </div>
  );
}
