import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createSimulationRuntime } from "@/runtime/simulationRuntime";
import { normalizeSimulationDsl } from "@/runtime/dslRuntimeMapper";
import { SimulationRuntimeSchema } from "@/runtime/schema/simulationDslSchema";
import { Play, Pause, RotateCcw, Move3D, Waves, Wind } from "lucide-react";
import { SimulationLoader } from "@/components/simulation/SimulationLoader";
import SimulationErrorOverlay from "./SimulationErrorOverlay";
import { motion, AnimatePresence } from "framer-motion";

interface SimulationCanvasProps {
  dsl?: any;
  title?: string;
  className?: string;
  compact?: boolean;
  onRuntimeReady?: (runtime: any) => void;
  onSimulationStateChange?: (snapshot: any) => void;
}

export function SimulationCanvas({ dsl, title, className = "", compact = false, onRuntimeReady, onSimulationStateChange }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<any>(null);
  const onRuntimeReadyRef = useRef(onRuntimeReady);
  onRuntimeReadyRef.current = onRuntimeReady;

  const [snapshot, setSnapshot] = useState<any>({ paused: false, time: 0, objectCount: 0, collisions: 0, timeScale: 1 });
  const [selection, setSelection] = useState<any>(null);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState<number | null>(null);
  const [preloadStage, setPreloadStage] = useState<string | undefined>(undefined);

  const normalizedDsl = useMemo(() => normalizeSimulationDsl(dsl), [dsl]);

  const expectedTotalAssets = useMemo(() => {
    if (!normalizedDsl?.objects) return 0;
    return normalizedDsl.objects.filter((o: any) => o?.asset?.filePath).length;
  }, [normalizedDsl]);

  // FIX 1: Lifted preloadCounts into a ref so the waitForPreload closure always
  // reads the latest value. Using useState here caused a stale-closure bug:
  // the Promise's inner `check` function captured the initial null value of
  // preloadCounts and never saw updates, so the loader never resolved.
  const preloadCountsRef = useRef<{ loaded: number; total: number; failed: number } | null>(null);

  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const validation = useMemo(() => {
    try {
      console.log("[SimulationCanvas] Validating DSL with Zod Schema:", normalizedDsl);
      const res = SimulationRuntimeSchema.safeParse(normalizedDsl);
      if (!res.success) {
        console.error("[SimulationCanvas] Zod Validation Failed:", res.error);
      } else {
        console.log("[SimulationCanvas] Zod Validation Success.");
      }
      return res;
    } catch (e) {
      console.error("[SimulationCanvas] Zod Parse Crashed:", e);
      return { success: false, error: e } as any;
    }
  }, [normalizedDsl]);

  const hasRenderableDsl = Boolean(validation?.success && Array.isArray(validation.data?.objects) && (validation.data?.objects?.length ?? 0) > 0);

  if (!hasRenderableDsl && validation?.success) {
    console.warn("[SimulationCanvas] DSL validated but has no objects to render.");
  }

  const hasInitialized = useRef(false);
  const onSimulationStateChangeRef = useRef(onSimulationStateChange);
  onSimulationStateChangeRef.current = onSimulationStateChange;

  useEffect(() => {
    if (!canvasRef.current || !hasRenderableDsl) return;
    if (hasInitialized.current) return;

    hasInitialized.current = true;

    let didCancel = false;

    (async () => {
      try {
        if (!validation?.success) {
          const message = validation?.error ? JSON.stringify(validation.error.format()) : "DSL validation failed (Zod)";
          console.error("[SimulationCanvas] Aborting runtime init due to validation error:", message);
          throw new Error(message);
        }

        console.log("[SimulationCanvas] Creating Matter.js runtime...");

        runtimeRef.current?.destroy?.();
        const runtime = createSimulationRuntime({
          canvas: canvasRef.current!,
          dsl: normalizedDsl,
          onStateChange: (snap: any) => {
            setSnapshot(prev => ({ ...prev, ...snap }));
            onSimulationStateChangeRef.current?.(snap);
          },
          onSelectionChange: setSelection,
          onAssetsProgress: (p: any) => {
            setPreloadStage('Loading Assets');
            // FIX 1: Write to ref instead of state so the waitForPreload
            // closure below always reads the current value without re-running
            // the effect or causing a stale closure.
            preloadCountsRef.current = { loaded: p.loaded, total: p.total, failed: p.failed };
            setPreloadProgress(p.total > 0 ? Math.round((p.loaded / p.total) * 100) : null);
          },
        });

        runtimeRef.current = runtime;
        onRuntimeReadyRef.current?.(runtime);

        runtime.pause();

        // FIX 1: Read from ref inside the polling loop so it always gets the
        // latest asset counts rather than the stale closure value from useState.
        const waitForPreload = new Promise<void>((resolve) => {
          const check = () => {
            if (didCancel) return resolve();
            const counts = preloadCountsRef.current;
            const isFinished = counts
              ? (counts.total === 0 || (counts.loaded + counts.failed) >= counts.total)
              : (expectedTotalAssets === 0);

            if (isFinished) {
              resolve();
            } else {
              setTimeout(check, 150);
            }
          };
          check();
        });

        // FIX 2: Added a 5-second timeout to waitForPreload so the loader never
        // hangs indefinitely when onAssetsProgress is never called (i.e. the
        // runtime has no assets to preload and never fires the callback).
        const preloadTimeout = new Promise<void>((resolve) =>
          setTimeout(() => {
            console.warn("[SimulationCanvas] Asset preload timed out. Continuing anyway.");
            resolve();
          }, 5000)
        );

        await Promise.race([waitForPreload, preloadTimeout]);

        console.log("[SimulationCanvas] Assets preloaded. Finalizing UI.");
        if (!didCancel) setIsCanvasLoading(false);
      } catch (error: any) {
        console.error("Runtime initialization failed:", error);
        if (!didCancel) {
          setRuntimeError(error instanceof Error ? error.message : String(error));
          setIsCanvasLoading(false);
          hasInitialized.current = false;
          runtimeRef.current = null;
        }
      }
    })();

    return () => {
      didCancel = true;
      runtimeRef.current?.destroy?.();
      runtimeRef.current = null;
      hasInitialized.current = false;
    };
  }, [hasRenderableDsl, normalizedDsl]);

  if (runtimeError) {
    return (
      <div className={`relative ${className}`}>
        <div className={`flex min-h-[480px] items-center justify-center rounded-[28px] border border-white/5 bg-slate-950/90 text-slate-300`}>
          <div className="max-w-md space-y-4 text-center p-6">
            <div className="text-sm font-semibold text-red-300">Runtime failed to initialize</div>
            <p className="text-xs text-slate-400">{runtimeError}</p>
            <button
              type="button"
              onClick={() => {
                setRuntimeError(null);
                setIsCanvasLoading(true);
                hasInitialized.current = false;
              }}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
        {/* FIX 3: Deduplicated the error display — original code rendered both
            an inline error block AND SimulationErrorOverlay simultaneously.
            Now only SimulationErrorOverlay is used; the inline block is removed. */}
        <SimulationErrorOverlay
          error={runtimeError}
          onRetry={() => {
            setRuntimeError(null);
            setIsCanvasLoading(true);
            hasInitialized.current = false;
          }}
        />
      </div>
    );
  }

  if (!hasRenderableDsl) {
    return (
      <div className={`flex min-h-[480px] items-center justify-center rounded-[28px] border border-white/5 bg-slate-950/80 text-slate-500 ${className}`}>
        <SimulationLoader />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-white/5 bg-slate-950 shadow-2xl ${className}`}>
      <div className="absolute left-4 top-4 z-20 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Matter.js Live</p>
      </div>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur-xl">
        <span className="flex items-center gap-1"><Move3D className="h-3 w-3 text-cyan-300" /> {snapshot.objectCount}</span>
        <span className="h-2.5 w-px bg-white/10" />
        <span className="flex items-center gap-1"><Waves className="h-3 w-3 text-indigo-300" /> {snapshot.collisions}</span>
        <span className="h-2.5 w-px bg-white/10" />
        {/* FIX 4: Added a nullish fallback before calling .toFixed() — if
            snapshot.time arrives as undefined/null the original code would
            throw "Cannot read properties of undefined (reading 'toFixed')". */}
        <span className="flex items-center gap-1"><Wind className="h-3 w-3 text-emerald-300" /> {(snapshot.time ?? 0).toFixed(1)}s</span>
      </div>

      <div className="relative h-full w-full">
        <AnimatePresence>
          {isCanvasLoading && (
            <motion.div
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-[40]"
            >
              <SimulationLoader stage={preloadStage} progress={preloadProgress ?? undefined} />
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-2xl"
        >
          <button
            type="button"
            onClick={() => {
              if (snapshot.paused) {
                runtimeRef.current?.play?.();
              } else {
                runtimeRef.current?.pause?.();
              }
              setSnapshot((prev: any) => ({ ...prev, paused: !prev.paused }));
            }}
            title="Play/Pause"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {snapshot.paused ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              runtimeRef.current?.reset?.();
              setSnapshot((prev: any) => ({ ...prev, paused: true, time: 0 }));
            }}
            title="Reset Simulation"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newSpeed = Math.max(0.5, snapshot.timeScale - 0.25);
                runtimeRef.current?.setSpeed?.(newSpeed);
                setSnapshot((prev: any) => ({ ...prev, timeScale: newSpeed }));
              }}
              title="Slower"
              className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
            >
              −
            </button>
            {/* FIX 5: Added nullish fallback for timeScale before .toFixed() for
                the same reason as snapshot.time above — avoids a crash if the
                snapshot arrives before timeScale is populated. */}
            <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
              {(snapshot.timeScale ?? 1).toFixed(2)}x
            </span>
            <button
              type="button"
              onClick={() => {
                const newSpeed = Math.min(2, snapshot.timeScale + 0.25);
                runtimeRef.current?.setSpeed?.(newSpeed);
                setSnapshot((prev: any) => ({ ...prev, timeScale: newSpeed }));
              }}
              title="Faster"
              className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-white text-xs transition-colors"
            >
              +
            </button>
          </div>

          <div className="ml-2 text-[11px] font-mono text-slate-400">
            {snapshot.paused ? "⏸ Paused" : "▶ Playing"}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default SimulationCanvas;