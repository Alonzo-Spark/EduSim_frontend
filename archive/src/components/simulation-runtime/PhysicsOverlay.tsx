import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import {
  ArrowUpRight,
  BadgeInfo,
  Box,
  Copy,
  Lock,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  Sliders,
  Sparkles,
  Trash2,
  Unlock,
  Gauge,
  Activity,
} from "lucide-react";
import { SIMULATION_PRESETS, getPresetById } from "@/simulations/presets";

type RuntimeApi = {
  pause?: () => void;
  resume?: () => void;
  togglePause?: () => boolean;
  reset?: (dsl?: any) => void;
  setTimeScale?: (scale: number) => void;
  stepFrame?: () => void;
  seekTo?: (timeSeconds: number) => void;
  duplicateSelected?: () => void;
  deleteSelected?: () => boolean;
  toggleLockSelected?: () => boolean;
  scaleSelected?: (factor: number) => boolean;
  rotateSelected?: (angle: number) => boolean;
  setSelectedVelocity?: (vector: { x: number; y: number }) => boolean;
  setSelectedForce?: (vector: { x: number; y: number }) => boolean;
  updateSelectedObject?: (patch: any) => boolean;
  spawnObject?: (object: any, position?: { x: number; y: number }) => any;
  getSelection?: () => { bodyId?: string | null; object?: any | null };
  setDsl?: (dsl: any) => void;
};

export interface PhysicsOverlayProps {
  runtime?: RuntimeApi | null;
  snapshot?: any;
  dsl?: any;
  onPresetSelect?: (presetId: string) => void;
  onAddObject?: (type: string) => void;
  className?: string;
}

const QUICK_ADD = ["block", "sphere", "projectile", "pendulum", "spring", "truck", "character", "obstacle"];

function pretty(value: any) {
  if (value == null) return "-";
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(Math.abs(value) >= 10 ? 1 : 2) : "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function StatChip({ label, value, accent = "cyan" }: { label: string; value: any; accent?: "cyan" | "violet" | "amber" | "emerald" | "rose" }) {
  const ring = {
    cyan: "border-cyan-400/20 text-cyan-200",
    violet: "border-violet-400/20 text-violet-200",
    amber: "border-amber-400/20 text-amber-200",
    emerald: "border-emerald-400/20 text-emerald-200",
    rose: "border-rose-400/20 text-rose-200",
  }[accent];

  return (
    <div className={`rounded-2xl border bg-black/30 px-3 py-2 backdrop-blur-xl ${ring}`}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold">{pretty(value)}</div>
    </div>
  );
}

export function PhysicsOverlay({ runtime, snapshot, dsl, onPresetSelect, onAddObject, className = "" }: PhysicsOverlayProps) {
  const [showInspector, setShowInspector] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState(SIMULATION_PRESETS[0]?.id || "newtons-law");

  const selection = runtime?.getSelection?.() || snapshot?.selectedObject ? { object: snapshot?.selectedObject } : { object: null };
  const selectedObject = selection.object || null;
  const preset = useMemo(() => getPresetById(selectedPresetId), [selectedPresetId]);

  const speed = snapshot?.timeScale ?? 1;

  const setPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    onPresetSelect?.(presetId);
    const nextDsl = getPresetById(presetId)?.scene;
    if (nextDsl && runtime?.setDsl) {
      runtime.setDsl(nextDsl);
    }
  };

  const updateSelected = (patch: any) => {
    if (!selectedObject) return;
    runtime?.updateSelectedObject?.(patch);
  };

  const selectedPhysics = selectedObject?.physics || {};
  const selectedMaterial = selectedObject?.material || {};
  const selectedVisual = selectedObject?.visual || {};

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <PanelGroup direction="horizontal" className="h-full w-full">
        <Panel defaultSize={70} minSize={52} className="pointer-events-none">
          <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-1rem)] flex-wrap gap-2 pointer-events-auto">
            <StatChip label="Speed" value={`${speed}x`} accent="violet" />
            <StatChip label="Time" value={`${snapshot?.time?.toFixed?.(2) ?? "0.00"}s`} accent="cyan" />
            <StatChip label="Objects" value={snapshot?.objectCount ?? dsl?.objects?.length ?? 0} accent="emerald" />
            <StatChip label="Collisions" value={snapshot?.collisions ?? 0} accent="amber" />
            <StatChip label="Gravity" value={dsl?.environment?.gravity?.y ?? dsl?.environment?.gravity ?? 9.81} accent="rose" />
          </div>

          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 pointer-events-auto">
            <button className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-xl transition hover:bg-black/70" onClick={() => runtime?.togglePause?.()}>
              <span className="inline-flex items-center gap-2"><Pause className="h-3.5 w-3.5" /> Pause/Play</span>
            </button>
            <button className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-xl transition hover:bg-black/70" onClick={() => runtime?.stepFrame?.()}>
              <span className="inline-flex items-center gap-2"><ArrowUpRight className="h-3.5 w-3.5" /> Step</span>
            </button>
            <button className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-xl transition hover:bg-black/70" onClick={() => runtime?.reset?.(dsl)}>
              <span className="inline-flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" /> Replay</span>
            </button>
            <button className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-xl transition hover:bg-black/70" onClick={() => runtime?.setTimeScale?.(Math.max(0.25, speed - 0.25))}>
              <span className="inline-flex items-center gap-2"><Minus className="h-3.5 w-3.5" /> Slower</span>
            </button>
            <button className="rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[11px] font-semibold text-white/85 backdrop-blur-xl transition hover:bg-black/70" onClick={() => runtime?.setTimeScale?.(Math.min(3, speed + 0.25))}>
              <span className="inline-flex items-center gap-2"><Plus className="h-3.5 w-3.5" /> Faster</span>
            </button>
          </div>

          <div className="absolute right-4 top-4 z-20 w-full max-w-[340px] pointer-events-auto">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-3 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Preset Selector</div>
                  <div className="text-sm font-semibold text-white">{preset?.title}</div>
                </div>
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SIMULATION_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id)}
                    className={`rounded-2xl border px-3 py-2 text-left transition ${selectedPresetId === item.id ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-50" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"}`}
                  >
                    <div className="text-xs font-semibold">{item.title}</div>
                    <div className="mt-1 text-[10px] text-slate-500 line-clamp-2">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="pointer-events-auto relative w-2 bg-transparent after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-white/10 hover:after:bg-cyan-300/50" />

        <Panel defaultSize={30} minSize={22} className="pointer-events-none">
          <AnimatePresence>
            {showInspector && (
              <motion.div
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 24, opacity: 0 }}
                className="absolute right-4 top-4 bottom-4 z-30 w-[320px] rounded-[28px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-2xl pointer-events-auto flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Object Inspector</div>
                    <div className="text-sm font-semibold text-white">{selectedObject?.name || "No selection"}</div>
                  </div>
                  <button className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white" onClick={() => setShowInspector(false)}>
                    <BadgeInfo className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatChip label="Mass" value={selectedPhysics.mass} accent="cyan" />
                  <StatChip label="Friction" value={selectedMaterial.friction} accent="violet" />
                  <StatChip label="Restitution" value={selectedMaterial.restitution} accent="amber" />
                  <StatChip label="Velocity" value={`${pretty(selectedPhysics.velocity?.x)} , ${pretty(selectedPhysics.velocity?.y)}`} accent="emerald" />
                </div>

                <div className="mt-4 space-y-3 overflow-auto pr-1 custom-scrollbar">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500"><Gauge className="h-3.5 w-3.5" /> Live Properties</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="space-y-1"><span className="text-slate-400">Mass</span><input className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" type="number" value={selectedPhysics.mass ?? 0} onChange={(e) => updateSelected({ physics: { ...selectedPhysics, mass: Number(e.target.value) } })} /></label>
                      <label className="space-y-1"><span className="text-slate-400">Friction</span><input className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" type="number" step="0.01" value={selectedMaterial.friction ?? 0} onChange={(e) => updateSelected({ material: { ...selectedMaterial, friction: Number(e.target.value) } })} /></label>
                      <label className="space-y-1"><span className="text-slate-400">Restitution</span><input className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" type="number" step="0.01" value={selectedMaterial.restitution ?? 0} onChange={(e) => updateSelected({ material: { ...selectedMaterial, restitution: Number(e.target.value) } })} /></label>
                      <label className="space-y-1"><span className="text-slate-400">Opacity</span><input className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white" type="number" step="0.05" value={selectedVisual.opacity ?? 1} onChange={(e) => updateSelected({ visual: { ...selectedVisual, opacity: Number(e.target.value) } })} /></label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500"><Activity className="h-3.5 w-3.5" /> Education Stats</div>
                    <div className="grid grid-cols-2 gap-2">
                      <StatChip label="Speed" value={pretty(selectedPhysics.velocity ? Math.hypot(selectedPhysics.velocity.x || 0, selectedPhysics.velocity.y || 0) : 0)} />
                      <StatChip label="Acceleration" value={pretty(selectedPhysics.acceleration ? Math.hypot(selectedPhysics.acceleration.x || 0, selectedPhysics.acceleration.y || 0) : 0)} />
                      <StatChip label="Momentum" value={pretty((selectedPhysics.mass || 0) * (selectedPhysics.velocity ? Math.hypot(selectedPhysics.velocity.x || 0, selectedPhysics.velocity.y || 0) : 0))} />
                      <StatChip label="Kinetic Energy" value={pretty(0.5 * (selectedPhysics.mass || 0) * Math.pow(selectedPhysics.velocity ? Math.hypot(selectedPhysics.velocity.x || 0, selectedPhysics.velocity.y || 0) : 0, 2))} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500"><Sliders className="h-3.5 w-3.5" /> Scene Composer</div>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ADD.map((item) => (
                        <button key={item} type="button" onClick={() => onAddObject?.(item)} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-left text-xs text-slate-200 hover:bg-white/10 transition">
                          Add {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      <span>Interaction Actions</span>
                      <button className="text-slate-400 hover:text-white" onClick={() => setShowTimeline((value) => !value)}><RotateCcw className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => runtime?.duplicateSelected?.()} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Duplicate</button>
                      <button type="button" onClick={() => runtime?.deleteSelected?.()} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Delete</button>
                      <button type="button" onClick={() => runtime?.toggleLockSelected?.()} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Lock / Unlock</button>
                      <button type="button" onClick={() => runtime?.scaleSelected?.(1.08)} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Resize</button>
                      <button type="button" onClick={() => runtime?.rotateSelected?.(0.15)} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Rotate</button>
                      <button type="button" onClick={() => runtime?.setSelectedForce?.({ x: 0.02, y: -0.01 })} className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200 hover:bg-white/10">Impulse</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setShowInspector((value) => !value)}
            className="absolute right-4 bottom-4 z-30 rounded-full border border-white/10 bg-slate-950/80 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-2xl transition hover:bg-white/10 pointer-events-auto"
          >
            {showInspector ? <span className="inline-flex items-center gap-2"><Minus className="h-3.5 w-3.5" /> Collapse</span> : <span className="inline-flex items-center gap-2"><Box className="h-3.5 w-3.5" /> Open Inspector</span>}
          </button>
        </Panel>
      </PanelGroup>

      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-2xl pointer-events-auto flex items-center gap-3 shadow-2xl"
          >
            <button type="button" onClick={() => runtime?.togglePause?.()} className="rounded-full bg-white text-slate-950 h-10 w-10 flex items-center justify-center">
              {snapshot?.paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
            </button>
            <button type="button" onClick={() => runtime?.stepFrame?.()} className="rounded-full border border-white/10 bg-white/5 text-white h-10 w-10 flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></button>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <span>Scrub</span>
              <input type="range" min={0} max={Math.max(1, snapshot?.time || 1)} step={0.1} defaultValue={snapshot?.time || 0} onChange={(e) => runtime?.seekTo?.(Number(e.target.value))} className="w-40 accent-cyan-400" />
            </label>
            <button type="button" onClick={() => runtime?.setTimeScale?.(1)} className="rounded-full border border-white/10 bg-white/5 text-white px-3 py-2 text-xs">1x</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PhysicsOverlay;