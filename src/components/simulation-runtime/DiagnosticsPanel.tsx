import React from "react";
import { PhysicsAnalytics } from "@/runtime/analytics/physicsAnalytics";
import { ReplayFrame } from "@/runtime/replay/simulationReplay";
import { TimelineMarker } from "@/runtime/timeline/runtimeTimeline";

type DiagnosticsPanelProps = {
  analytics: PhysicsAnalytics | null;
  replayFrame?: ReplayFrame | null;
  timelineMarkers?: TimelineMarker[];
  preloadStatus?: { loaded: number; total: number; failed: number } | null;
  visible?: boolean;
};

function Metric({ label, value, unit = "" }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-[11px] text-white">
        {value}
        {unit}
      </div>
    </div>
  );
}

export function DiagnosticsPanel({ analytics, replayFrame, timelineMarkers = [], preloadStatus, visible = true }: DiagnosticsPanelProps) {
  if (!visible) return null;
  const diagnostics = analytics?.getDiagnostics() ?? null;
  const summary = analytics?.getEducationalSummary() ?? "No diagnostics yet.";
  const latestFrame = replayFrame;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Diagnostics Panel</div>
          <div className="text-xs text-white/60">Realtime health and educational diagnostics</div>
        </div>
        <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
          {diagnostics ? `stability ${diagnostics.stability.toFixed(0)}%` : "warming up"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="FPS" value={(diagnostics?.fps ?? 0).toFixed(1)} />
        <Metric label="Stability" value={(diagnostics?.stability ?? 0).toFixed(0)} unit="%" />
        <Metric label="Momentum" value={(diagnostics?.momentum ?? 0).toFixed(2)} />
        <Metric label="KE" value={(diagnostics?.kineticEnergy ?? 0).toFixed(2)} unit="J" />
        <Metric label="PE" value={(diagnostics?.potentialEnergy ?? 0).toFixed(2)} unit="J" />
        <Metric label="Forces" value={(diagnostics?.forceMagnitude ?? 0).toFixed(2)} />
        <Metric label="Collisions" value={(diagnostics?.collisionFrequency ?? 0).toFixed(0)} />
        <Metric label="Restitution" value={(diagnostics?.restitutionEfficiency ?? 0).toFixed(2)} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] text-slate-200">
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">Runtime Health</div>
          <div>Timeline markers: {timelineMarkers.length}</div>
          <div>Replay frame: {latestFrame?.id ?? "-"}</div>
          <div>Entities: {latestFrame?.entities.length ?? 0}</div>
          <div>Interactions: {latestFrame?.interactions.length ?? 0}</div>
          <div>Energy total: {(latestFrame?.energy?.total ?? 0).toFixed(2)} J</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] text-slate-200">
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">Preload Status</div>
          <div>Loaded: {preloadStatus?.loaded ?? 0}</div>
          <div>Total: {preloadStatus?.total ?? 0}</div>
          <div>Failed: {preloadStatus?.failed ?? 0}</div>
          <div className="mt-2 text-slate-300">{summary}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-3 text-[11px] text-slate-200">
        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">Physics Warnings</div>
        {diagnostics && diagnostics.stability < 60 ? (
          <div className="text-amber-300">Stability is low. Consider pausing and inspecting collision momentum and energy losses frame-by-frame.</div>
        ) : (
          <div className="text-emerald-300">System stable. Replay and diagnostics remain synchronized.</div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticsPanel;
