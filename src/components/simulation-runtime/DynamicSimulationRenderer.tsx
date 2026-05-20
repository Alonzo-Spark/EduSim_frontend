import React, { useEffect, useMemo, useRef, useState } from "react";
import { PhysicsEngine } from "@/runtime/physicsEngine";
import { SimulationDSL, SimulationSnapshot } from "@/runtime/dsl";
import { SimulationRenderer } from "@/runtime/rendering";
import { Play, Pause, RotateCcw, Settings2, Layout, SkipForward } from "lucide-react";
import SimulationController, { RuntimeState } from "@/runtime/controllers/simulationController";
import { EquationHUD } from "./EquationHUD";
import { renderPhysicsOverlays } from "@/runtime/rendering/physicsOverlayRenderer";
import { buildInteractionGraph } from "@/runtime/graphs/interactionGraph";
import { createExplanationEngine } from "@/runtime/education/explanationEngine";
import runtimeEvents from "@/runtime/events/runtimeEvents";
import { createSimulationReplay, ReplayFrame } from "@/runtime/replay/simulationReplay";
import { createPhysicsAnalytics, PhysicsAnalytics } from "@/runtime/analytics/physicsAnalytics";
import { createRuntimeTimeline, RuntimeTimeline } from "@/runtime/timeline/runtimeTimeline";
import { preloadAssets } from "@/runtime/assets/preloadAssets";
import { normalizeSimulationDsl } from "@/runtime/dslRuntimeMapper";
import { SimulationRuntimeSchema } from "@/runtime/schema/simulationDslSchema";
import { resolveBestAsset } from "@/utils/assetCatalogResolver";
import PhysicsGraphs from "./PhysicsGraphs";
import DiagnosticsPanel from "./DiagnosticsPanel";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { HtmlRenderer } from "./HtmlRenderer";

// Simple image load cache to avoid re-requesting previews on every render
const imageCache: Record<string, { loaded: boolean; width: number; height: number }> = {};

function useImageStatus(url?: string) {
  const [state, setState] = useState<{ loaded: boolean; width: number; height: number } | null>(
    url && imageCache[url] ? imageCache[url] : null,
  );

  useEffect(() => {
    if (!url) return;
    if (imageCache[url]) {
      setState(imageCache[url]);
      return;
    }

    const img = new Image();
    img.src = url;
    const onLoad = () => {
      const info = { loaded: true, width: img.naturalWidth || img.width || 0, height: img.naturalHeight || img.height || 0 };
      imageCache[url] = info;
      setState(info);
    };
    const onError = () => {
      const info = { loaded: false, width: 0, height: 0 };
      imageCache[url] = info;
      setState(info);
    };
    img.addEventListener("load", onLoad);
    img.addEventListener("error", onError);
    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
    };
  }, [url]);

  return state ?? { loaded: false, width: 0, height: 0 };
}

function getResolvedAssetPath(obj: any) {
  const match = resolveBestAsset(obj?.asset?.id || obj?.type || obj?.name || obj?.id, obj?.asset?.category || obj?.type);
  return match?.path || obj?.asset?.filePath || obj?.props?.assetUrl || obj?.assetUrl || obj?.asset?.path || "";
}

function DebugObjectRow({ obj }: { obj: any }) {
  const assetPath = getResolvedAssetPath(obj);
  const img = useImageStatus(assetPath);
  const shape = obj?.shape || {};
  const physics = obj?.physics || obj?.body || {};
  const sizeText = shape?.width && shape?.height ? `${shape.width}x${shape.height}` : shape?.radius ? `${shape.radius*2}x${shape.radius*2}` : "n/a";

  return (
    <div className="mb-2 pb-2 border-b border-white/5">
      <div className="text-[11px] text-indigo-300">id: {obj.id}</div>
      <div className="text-[10px] text-slate-300 break-words">asset: {assetPath || "(no asset)"}</div>
      <div className="mt-1 text-[10px] text-slate-400">size: {sizeText} • img: {img.loaded ? `${img.width}x${img.height}` : "not loaded"}</div>
      <div className="text-[10px] text-slate-400">mass: {physics?.mass ?? "?"} • body: {physics?.width ? `${physics.width}x${physics.height}` : physics?.radius ? `${physics.radius*2}x${physics.radius*2}` : "n/a"}</div>
    </div>
  );
}

function replayFrameToSnapshot(frame: ReplayFrame | null, baseDsl?: SimulationDSL | null): SimulationSnapshot | null {
  if (!frame) return null;
  const objects = (baseDsl?.objects || []).map((object: any) => {
    const replayEntity = frame.entities.find((entity) => entity.id === String(object.id));
    if (!replayEntity) return object;
    return {
      ...object,
      physics: {
        ...(object.physics || {}),
        position: { ...replayEntity.position },
        velocity: { ...replayEntity.velocity },
        acceleration: { ...(replayEntity.acceleration || object.physics?.acceleration || { x: 0, y: 0 }) },
        mass: replayEntity.mass ?? object.physics?.mass,
        angle: replayEntity.angle ?? object.physics?.angle,
        angularVelocity: replayEntity.angularVelocity ?? object.physics?.angularVelocity,
      },
      position: { ...replayEntity.position },
      velocity: { ...replayEntity.velocity },
    };
  });

  return {
    time: frame.time,
    paused: frame.paused,
    dsl: {
      ...(baseDsl || ({} as SimulationDSL)),
      objects,
      interactions: baseDsl?.interactions || [],
      equations: frame.equations || baseDsl?.equations || [],
    } as SimulationDSL,
  };
}

interface DynamicSimulationRendererProps {
  dsl?: SimulationDSL;
  html?: string;
  title?: string;
}

export const DynamicSimulationRenderer: React.FC<DynamicSimulationRendererProps> = ({ dsl, html, title }) => {
  const normalizedDsl = useMemo(() => normalizeSimulationDsl(dsl), [dsl]);
  const validation = useMemo(() => SimulationRuntimeSchema.safeParse(normalizedDsl), [normalizedDsl]);
  const runtimeDsl = validation.success ? validation.data : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const controllerRef = useRef<SimulationController | null>(null);
  const replayRef = useRef(createSimulationReplay({ maxFrames: 900, compression: true }));
  const analyticsRef = useRef<PhysicsAnalytics | null>(createPhysicsAnalytics());
  const timelineRef = useRef<RuntimeTimeline | null>(createRuntimeTimeline());
  const snapshotRef = useRef<SimulationSnapshot | null>(null);
  const explanationRef = useRef(createExplanationEngine(() => snapshotRef.current));
  const runtimeEventLogRef = useRef<any[]>([]);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [replayFrame, setReplayFrame] = useState<ReplayFrame | null>(null);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replayMode, setReplayMode] = useState(false);
  const [timelineMarkers, setTimelineMarkers] = useState<any[]>([]);
  const [analyticsTick, setAnalyticsTick] = useState(0);
  const [explanations, setExplanations] = useState<any[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [showGraphs, setShowGraphs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [learningMode, setLearningMode] = useState<"guided" | "slow" | "step">("guided");
  const [runtimePhase, setRuntimePhase] = useState<string>(RuntimeState.IDLE);
  const [preloadStatus, setPreloadStatus] = useState<{ loaded: number; total: number; failed: number; current?: string } | null>(null);
  const showVectorsRef = useRef(showVectors);
  const replayModeRef = useRef(replayMode);

  const inspectorObjects = useMemo(() => {
    const objects = Array.isArray(snapshot?.dsl?.objects) ? snapshot.dsl.objects : [];
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return objects;
    return objects.filter((object: any) => {
      const haystack = [object.id, object.name, object.type, object.asset?.id, object.asset?.filePath, object.visual?.label].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [snapshot, searchTerm]);

  const renderOverlayForSnapshot = (renderSnapshot: SimulationSnapshot) => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;
    const width = overlayCanvas.clientWidth || overlayCanvas.width;
    const height = overlayCanvas.clientHeight || overlayCanvas.height;
    const ratio = window.devicePixelRatio || 1;
    overlayCanvas.width = Math.floor(width * ratio);
    overlayCanvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const graph = buildInteractionGraph(renderSnapshot.dsl, runtimeEventLogRef.current);
    renderPhysicsOverlays(ctx, renderSnapshot, {
      showCollisionNormals: showVectorsRef.current,
      showContacts: true,
      showImpulseVectors: showVectorsRef.current,
      showFrictionVectors: true,
      showAccelerationVectors: showVectorsRef.current,
      showGravityField: true,
      showSpringConstraints: true,
      showForcePoints: true,
      showCenterOfMass: true,
      showConstraintTension: true,
      runtimeEventsLog: runtimeEventLogRef.current,
      interactionGraph: graph,
    });
  };

  const renderFrameToCanvas = (renderSnapshot: SimulationSnapshot) => {
    if (rendererRef.current) {
      rendererRef.current.render(renderSnapshot);
    }
    renderOverlayForSnapshot(renderSnapshot);
  };

  const updateReplayFrame = (frameIndex: number) => {
    const frames = replayRef.current.getFrames();
    if (!frames.length) return;
    const safeIndex = Math.max(0, Math.min(frames.length - 1, Math.round(frameIndex)));
    const frame = replayRef.current.jumpToFrame(safeIndex);
    if (!frame) return;
    setReplayIndex(safeIndex);
    setReplayFrame(frame);
    setReplayMode(true);
    controllerRef.current?.pause();
    const replaySnapshot = replayFrameToSnapshot(frame, snapshotRef.current?.dsl || snapshot?.dsl || dsl || null);
    if (replaySnapshot) {
      renderFrameToCanvas(replaySnapshot);
    }
  };

  const exitReplayMode = () => {
    setReplayMode(false);
    setReplayFrame(null);
    controllerRef.current?.play();
  };

  const exportTextFile = (name: string, text: string) => {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    showVectorsRef.current = showVectors;
  }, [showVectors]);

  useEffect(() => {
    replayModeRef.current = replayMode;
  }, [replayMode]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.start();
      setTimelineMarkers(timelineRef.current.getMarkers());
    }
    return () => timelineRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!controllerRef.current) return;
    if (learningMode === "slow") controllerRef.current.setSpeed(0.35);
    if (learningMode === "step") controllerRef.current.setSpeed(0.25);
    if (learningMode === "guided") controllerRef.current.setSpeed(0.5);
    explanationRef.current.setMode(learningMode);
  }, [learningMode]);

  useEffect(() => {
    setTimelineMarkers(timelineRef.current?.getMarkers() || []);
  }, [analyticsTick]);

  useEffect(() => {
    if (!runtimeDsl || !canvasRef.current) {
      return;
    }

    explanationRef.current.stop();
    explanationRef.current.start();
    replayRef.current.clear();
    replayRef.current.start();
    analyticsRef.current = createPhysicsAnalytics();
    runtimeEventLogRef.current = [];
    setReplayMode(false);
    setReplayFrame(null);
    setReplayIndex(0);
    setTimelineMarkers([]);
    setExplanations([]);
    setPreloadStatus(null);

    const controller = new SimulationController();
    controllerRef.current = controller;
    const disposeStateListener = controller.on("state", (payload: any) => {
      setRuntimePhase(String(payload?.state || controller.state || RuntimeState.IDLE));
    });
    setRuntimePhase(String(controller.state));

    const eventDisposers = [
      runtimeEvents.on("collision_start", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "collision" }];
      }),
      runtimeEvents.on("force_applied", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "force" }];
      }),
      runtimeEvents.on("equation_updated", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: event?.kind || "equation" }];
      }),
      runtimeEvents.on("runtime_paused", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "pause" }];
      }),
      runtimeEvents.on("runtime_resumed", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "resume" }];
      }),
      runtimeEvents.on("entity_spawned", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "entity" }];
      }),
      runtimeEvents.on("preload_complete", (event) => {
        runtimeEventLogRef.current = [...runtimeEventLogRef.current.slice(-119), { ...event, kind: "preload" }];
      }),
    ];

    const assetUrls = Array.from(
      new Set(
        (runtimeDsl.objects || [])
          .map((object: any) => getResolvedAssetPath(object))
          .filter((path: string) => Boolean(path && String(path).trim())),
      ),
    );

    let cancelled = false;
    let unsubscribe = () => {};

    (async () => {
      try {
        controller.transitionTo(RuntimeState.GENERATING);
        controller.transitionTo(RuntimeState.VALIDATING);
        controller.transitionTo(RuntimeState.NORMALIZING);
        controller.transitionTo(RuntimeState.PRELOADING_ASSETS);

        if (assetUrls.length > 0) {
          const preloadResult = await preloadAssets(assetUrls, (progress) => {
            if (cancelled) return;
            setPreloadStatus(progress);
          }, { retries: 1, timeoutMs: 8000 });

          if (!cancelled) {
            setPreloadStatus({ loaded: preloadResult.loaded, total: preloadResult.total, failed: preloadResult.failed });
            runtimeEvents.emit("preload_complete", { ...preloadResult, assets: assetUrls });
          }
        } else {
          runtimeEvents.emit("preload_complete", { loaded: 0, total: 0, failed: 0, assets: [] });
        }

        if (cancelled) return;

        controller.transitionTo(RuntimeState.INITIALIZING_RUNTIME);

        const engine = new PhysicsEngine(runtimeDsl);
        const renderer = new SimulationRenderer(canvasRef.current!);

        engineRef.current = engine;
        rendererRef.current = renderer;
        engine.pause();
        controller.attachRuntime(engine as any);

        unsubscribe = engine.subscribe((newSnapshot) => {
          const frame = replayRef.current.record(newSnapshot, {
            graphSnapshot: buildInteractionGraph(newSnapshot.dsl, runtimeEventLogRef.current),
          });
          if (frame) {
            analyticsRef.current?.ingestFrame(frame);
            setAnalyticsTick((value) => value + 1);
            setTimelineMarkers(timelineRef.current?.getMarkers() || []);
            setReplayFrame((current) => (replayModeRef.current ? current : frame));
          }

          setSnapshot(newSnapshot);

          const renderSnapshot = replayModeRef.current ? replayFrameToSnapshot(replayRef.current.getCurrentFrame() || frame, newSnapshot.dsl) : newSnapshot;
          if (renderSnapshot) {
            renderFrameToCanvas(renderSnapshot);
          }
          setExplanations(explanationRef.current.getEntries());
        });

        controller.transitionTo(RuntimeState.READY);

        if (!cancelled) {
          engine.start();
        }
      } catch (error) {
        console.error("Runtime initialization failed:", error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
      eventDisposers.forEach((dispose) => dispose());
      disposeStateListener();
      controllerRef.current?.destroy();
      controllerRef.current = null;
      explanationRef.current.stop();
      replayRef.current.stop();
      timelineRef.current?.stop();
      engineRef.current?.stop();
      engineRef.current = null;
      rendererRef.current = null;
    };
  }, [runtimeDsl]);

  // Handle HTML rendering if DSL is not provided
  if (html && !dsl) {
    return <HtmlRenderer html={html} title={title} />;
  }

  if (!dsl) {
    return (
      <div className="w-full h-[600px] rounded-3xl bg-slate-900/20 border border-white/5 flex flex-col items-center justify-center text-slate-500 italic">
        <Layout className="w-12 h-12 mb-4 opacity-20" />
        No simulation data to render.
      </div>
    );
  }

  if (!runtimeDsl) {
    return (
      <div className="w-full h-[600px] rounded-3xl border border-rose-500/20 bg-slate-950/90 flex flex-col items-center justify-center text-center text-slate-200 p-8">
        <div className="max-w-lg space-y-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-rose-300">DSL validation failed</div>
          <div className="text-lg font-semibold">The simulation payload could not be normalized into a runtime-safe schema.</div>
          <pre className="max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-left text-[11px] text-rose-200">
            {validation.success ? "Unexpected validation state." : validation.error.message}
          </pre>
        </div>
      </div>
    );
  }

  const handleControlChange = (bind: string, value: number) => {
    engineRef.current?.setControl(bind, value);
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col">
      {/* Simulation Title Overlay */}
      <div className="absolute top-6 left-8 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
          {runtimeDsl.meta?.title || title || "Physics Simulation"}
        </h2>
        <div className="flex gap-2 mt-1">
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
            {runtimeDsl.meta?.topic || "General"}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
            {runtimeDsl.meta?.difficulty || "Beginner"}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
            {runtimePhase}
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative cursor-crosshair">
        {showHUD && <EquationHUD snapshot={snapshot} visible={showHUD} />}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full outline-none"
        />
        <canvas
          ref={overlayCanvasRef}
          className="pointer-events-none absolute inset-0 z-[12] w-full h-full"
        />
        {/* Debug HUD for asset/runtime inspection (helps expose bad mappings) */}
        {snapshot && (
          <div className="absolute top-6 right-6 z-30 bg-black/60 backdrop-blur rounded-lg p-3 text-xs font-mono text-white max-w-xs max-h-[45vh] overflow-auto">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold">Inspector</div>
              <div className="flex items-center gap-2 text-[10px] text-white/60">
                <span>FPS stable</span>
                <button className="rounded bg-white/5 px-2 py-1" onClick={() => setShowVectors((v) => !v)}>{showVectors ? "Vectors on" : "Vectors off"}</button>
              </div>
            </div>
            <div className="mb-3 flex gap-2">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search entities"
                className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] outline-none"
              />
            </div>
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              preload {preloadStatus ? `${preloadStatus.loaded}/${preloadStatus.total}` : "pending"}
            </div>
            {Array.isArray(inspectorObjects) && inspectorObjects.slice(0,6).map((obj:any) => (
              <DebugObjectRow key={obj.id} obj={obj} />
            ))}

            <div className="absolute left-6 right-6 bottom-24 z-20 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <span>Replay Timeline</span>
                <div className="flex items-center gap-2">
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-200" onClick={() => replayRef.current.pauseReplay()}>Pause replay</button>
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-200" onClick={() => updateReplayFrame(replayIndex - 1)}>Step back</button>
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-200" onClick={() => updateReplayFrame(replayIndex + 1)}>Step forward</button>
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-200" onClick={() => replayRef.current.loopReplay(true)}>Loop</button>
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-200" onClick={exitReplayMode}>Live</button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, replayRef.current.getFrames().length - 1)}
                value={replayIndex}
                onChange={(event) => updateReplayFrame(Number(event.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {timelineMarkers.slice(-24).map((marker) => {
                  const color = marker.severity === "critical" ? "bg-red-400" : marker.severity === "warning" ? "bg-amber-400" : "bg-cyan-400";
                  return (
                    <span
                      key={marker.id}
                      title={`${marker.label}: ${marker.annotation || ""}`}
                      className={`h-2 w-2 rounded-full ${color}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="absolute left-6 bottom-40 z-20 w-[min(520px,calc(100%-3rem))] space-y-3">
              <PhysicsGraphs analytics={analyticsRef.current} replayFrame={replayMode ? replayFrame : replayRef.current.getCurrentFrame()} visible={showGraphs} />
              <DiagnosticsPanel
                analytics={analyticsRef.current}
                replayFrame={replayMode ? replayFrame : replayRef.current.getCurrentFrame()}
                timelineMarkers={timelineMarkers}
                preloadStatus={preloadStatus ? { loaded: preloadStatus.loaded, total: preloadStatus.total, failed: preloadStatus.failed } : analyticsRef.current ? { loaded: timelineMarkers.filter((marker) => marker.type === "preload").length, total: Math.max(1, timelineMarkers.filter((marker) => marker.type !== "pause").length), failed: timelineMarkers.filter((marker) => marker.severity === "critical").length } : null}
                visible={showDiagnostics}
              />
            </div>
            <div className="mt-2 border-t border-white/5 pt-2">
              <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">Explanations</div>
              {explanations.slice(0, 3).map((entry) => (
                <div key={entry.id} className="mb-2 rounded border border-white/5 bg-white/5 p-2">
                  <div className="text-[11px] font-semibold text-white">{entry.title}</div>
                  <div className="text-[10px] text-slate-300">{entry.body}</div>
                  {entry.equation && <div className="mt-1 font-mono text-[10px] text-emerald-300">{entry.equation}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Floating Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl z-20 pointer-events-auto">
          <button 
            onClick={() => controllerRef.current?.togglePause()}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-950 hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Play/Pause"
          >
            {snapshot?.paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
          </button>

          <button 
            onClick={() => controllerRef.current?.step()}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all border border-white/10"
            title="Step"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button 
            onClick={() => controllerRef.current?.reset()}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all border border-white/10"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => setLearningMode("guided")}
            className={`rounded-full px-3 py-1 text-[11px] ${learningMode === "guided" ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-300"}`}
          >
            Guided
          </button>
          <button
            type="button"
            onClick={() => setLearningMode("step")}
            className={`rounded-full px-3 py-1 text-[11px] ${learningMode === "step" ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-300"}`}
          >
            Step-by-step
          </button>
          <button
            type="button"
            onClick={() => setLearningMode("slow")}
            className={`rounded-full px-3 py-1 text-[11px] ${learningMode === "slow" ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300"}`}
          >
            Slow motion
          </button>

          <button
            type="button"
            onClick={() => updateReplayFrame(replayIndex)}
            className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-slate-300"
          >
            Replay
          </button>

          <button 
            onClick={() => setShowControls(!showControls)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showControls ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
          
          <div className="text-slate-400 text-xs font-mono ml-2 tabular-nums">
            <span className="mr-2">{snapshot?.time.toFixed(2)}s</span>
            <span className="px-2 py-0.5 rounded bg-white/5 text-[11px]">{controllerRef.current?.state ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Sidebar Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-0 right-0 h-full w-80 bg-slate-900/60 backdrop-blur-2xl border-l border-white/5 p-8 overflow-y-auto custom-scrollbar z-30 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                Inspector
              </h3>
              <button
                type="button"
                onClick={() => setShowInspector((value) => !value)}
                className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300"
              >
                {showInspector ? "Collapse" : "Expand"}
              </button>
            </div>
            {showInspector && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => setShowHUD((v) => !v)}>{showHUD ? "HUD on" : "HUD off"}</button>
                  <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => setShowVectors((v) => !v)}>{showVectors ? "Vectors on" : "Vectors off"}</button>
                </div>
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Runtime State</div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] text-slate-200">
                    <div>state: {controllerRef.current?.state ?? (snapshot?.paused ? "PAUSED" : "RUNNING")}</div>
                    <div>time: {snapshot?.time.toFixed(2)}s</div>
                    <div>entities: {inspectorObjects.length}</div>
                    <div>preload: ready</div>
                    <div>mode: {learningMode}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Entities</h4>
                    <span className="text-[10px] text-slate-500">{inspectorObjects.length} shown</span>
                  </div>
                  <div className="space-y-2">
                    {inspectorObjects.map((object: any, index: number) => (
                      <div key={object.id} className="rounded-xl border border-white/5 bg-black/20 p-3 text-[11px] text-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-white">{object.name || object.id}</div>
                          <button className="rounded bg-white/5 px-2 py-0.5 text-[10px]" onClick={() => engineRef.current?.setControl?.(`objects.${index}.physics.mass`, object.physics?.mass)}>
                            edit
                          </button>
                        </div>
                        <div className="mt-1 text-slate-400">mass {object.physics?.mass ?? "?"} • asset {object.asset?.id || object.asset?.filePath || "n/a"}</div>
                        <div className="text-slate-400">v {object.physics?.velocity ? `${object.physics.velocity.x.toFixed?.(2) ?? object.physics.velocity.x}, ${object.physics.velocity.y.toFixed?.(2) ?? object.physics.velocity.y}` : "n/a"}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interactions</h4>
                  <div className="space-y-3">
                    {dsl.interactions?.map((interaction) => {
                      const currentValue = engineRef.current?.getControl(interaction.bind) ?? interaction.value ?? 0;

                      return (
                        <div key={interaction.id} className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-semibold text-slate-300">{interaction.label}</label>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                              {typeof currentValue === "number" ? currentValue.toFixed(2) : String(currentValue)}{interaction.unit}
                            </span>
                          </div>

                          {interaction.type === "slider" && (
                            <Slider
                              defaultValue={[Number(interaction.value || 0)]}
                              min={interaction.min}
                              max={interaction.max}
                              step={interaction.step}
                              onValueChange={(val) => handleControlChange(interaction.bind, val[0])}
                              className="cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dsl.equations && dsl.equations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core Formulas</h4>
                    <div className="space-y-2">
                      {dsl.equations.map((eq, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 font-mono text-[11px] text-indigo-300/80 italic">
                          {eq}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Narration</h4>
                  <div className="space-y-2">
                    {explanations.slice(0, 6).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-white/5 bg-black/20 p-3 text-[11px] text-slate-200">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{entry.kind}</div>
                        <div className="font-semibold text-white">{entry.title}</div>
                        <div className="text-slate-300">{entry.body}</div>
                        {entry.equation && <div className="mt-1 font-mono text-[10px] text-emerald-300">{entry.equation}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exports</h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => exportTextFile("edusim-replay.json", replayRef.current.exportJSON({ title: dsl.meta?.title }))}>Replay JSON</button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => exportTextFile("edusim-analytics.json", analyticsRef.current?.exportJSON() || "{}")}>Analytics</button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => exportTextFile("edusim-timeline.json", timelineRef.current?.exportJSON() || "[]")}>Timeline</button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => exportTextFile("edusim-equations.json", JSON.stringify({ equations: dsl.equations || [] }, null, 2))}>Equations</button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => exportTextFile("edusim-diagnostics.json", JSON.stringify({ analytics: analyticsRef.current?.getDiagnostics(), markers: timelineMarkers }, null, 2))}>Diagnostics</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learning Mode</h4>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => controllerRef.current?.pause()}>
                      Pause & Explain
                    </button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => controllerRef.current?.step()}>
                      Step Once
                    </button>
                    <button className="rounded bg-white/5 px-2 py-1 text-slate-300" onClick={() => setLearningMode("guided") }>
                      Guided
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
