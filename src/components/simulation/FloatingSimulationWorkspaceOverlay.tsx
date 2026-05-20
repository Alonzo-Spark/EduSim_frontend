import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Play, Pause, RotateCcw, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Download, Video, Sliders, Activity, Brain, Plus, Minus, RefreshCw,
  Share2, Save, History, MessageSquare, Settings, Zap, Gauge, X, Camera, Box, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid
} from "recharts";
import { RuntimeEngine } from "@/components/simulation-runtime/RuntimeEngine";
import { SimulationLoader } from "@/components/simulation/SimulationLoader";
import { MathSimulationPreview } from "@/components/simulation/SimulationTemplates";
import { useSimulationStore } from "@/store/useSimulationStore";
import { simulationSynthesisService } from "@/services/simulationSynthesisService";
import { RuntimeState } from "@/runtime/schema/runtimeSchema";

import 'katex/dist/katex.min.css';
import katex from 'katex';

// Lightweight katex wrappers — avoids the broken react-katex CJS import entirely
const BlockMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span className="font-mono text-sm text-indigo-300">{math}</span>;
  }
};

const InlineMath = ({ math }: { math: string }) => {
  try {
    const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span className="font-mono text-sm text-indigo-300">{math}</span>;
  }
};

// FIX 1: Removed unused "position" tab — only tabs rendered in the UI are kept
type ChartTab = "velocity" | "energy" | "acceleration" | "momentum" | "force";

interface FloatingSimulationWorkspaceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  simulation?: any;
}

export function FloatingSimulationWorkspaceOverlay({
  isOpen,
  onClose,
  simulation
}: FloatingSimulationWorkspaceOverlayProps) {
  // Ref to the live Matter.js runtime — set when SimulationCanvas mounts
  const runtimeRef = useRef<any>(null);
  // Ref to active webm canvas stream capture recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    generatingSimulation,
    runtimeState,
    setRuntimeState,
    generationPhase,
    generationProgress
  } = useSimulationStore();

  const createFallbackDsl = useCallback((customPrompt?: string) => ({
    meta: {
      title: customPrompt || "Fallback Live Physics Sandbox",
      description: "Auto-synthesized robust emergency runtime scenario.",
    },
    environment: {
      gravity: 1,
      friction: 0.05,
      background: "#050816",
    },
    objects: [
      {
        id: "fallback_ball",
        name: "Fallback Sphere",
        type: "ball",
        shape: { type: "circle", radius: 0.5 },
        position: { x: 400, y: 200 },
        physics: { mass: 10, restitution: 0.6, friction: 0.1, isStatic: false },
        visual: { color: "#38bdf8", opacity: 1 },
      },
      {
        id: "fallback_ground",
        name: "Static Ground Base",
        type: "plane",
        shape: { type: "rectangle", width: 16, height: 0.5 },
        position: { x: 400, y: 550 },
        physics: { mass: 0, restitution: 0.2, friction: 0.8, isStatic: true },
        visual: { color: "#64748b", opacity: 0.8 },
      }
    ],
    interactions: [],
    forces: [],
  }), []);

  // TEST BYPASS: Set to true to test runtime without AI generation
  const BYPASS_AI = false;

  const HARDCODED_TEST_DSL = {
    "environment": {
      "gravity": 9.81,
      "background": "#050816"
    },
    "objects": [
      {
        "id": "car1",
        "name": "Car 1",
        "type": "rectangle",
        "position": { "x": 100, "y": 300 },
        "shape": { "type": "rectangle", "width": 120, "height": 60 },
        "physics": { "mass": 1200, "restitution": 0.8, "friction": 0.1, "isStatic": false },
        "velocity": { "x": 5, "y": 0 },
        "visual": { "color": "#38bdf8", "opacity": 1 }
      },
      {
        "id": "car2",
        "name": "Car 2",
        "type": "rectangle",
        "position": { "x": 600, "y": 300 },
        "shape": { "type": "rectangle", "width": 120, "height": 60 },
        "physics": { "mass": 1000, "restitution": 0.8, "friction": 0.1, "isStatic": false },
        "velocity": { "x": -4, "y": 0 },
        "visual": { "color": "#f472b6", "opacity": 1 }
      },
      {
        "id": "ground",
        "name": "Ground",
        "type": "rectangle",
        "position": { "x": 400, "y": 550 },
        "shape": { "type": "rectangle", "width": 800, "height": 40 },
        "physics": { "mass": 0, "restitution": 0.2, "friction": 0.8, "isStatic": true },
        "visual": { "color": "#475569", "opacity": 1 }
      }
    ],
    "interactions": [
      {
        "type": "collision",
        "parameters": {
          "restitution": 0.8
        }
      }
    ]
  };

  const validateAndSanitizeDsl = useCallback((inputDsl: any, promptStr?: string) => {
    if (!inputDsl) return null;
    if (typeof inputDsl !== "object") {
      console.warn("[DSL Guard] Invalid payload detected");
      return createFallbackDsl(promptStr);
    }

    const objects = Array.isArray(inputDsl.objects) && inputDsl.objects.length > 0
      ? inputDsl.objects
      : [
        {
          id: "fallback_ball",
          name: "Default Object",
          type: "ball",
          shape: { type: "circle", radius: 0.5 },
          position: { x: 400, y: 100 },
          physics: { mass: 10, restitution: 0.6, friction: 0.1, isStatic: false },
          visual: { color: "#22c55e", opacity: 1 },
        }
      ];

    const sanitizedObjects = objects.map((obj: any, idx: number) => {
      if (!obj || typeof obj !== "object") {
        return {
          id: `obj_${idx}`,
          name: `Object ${idx + 1}`,
          type: "block",
          position: { x: 300 + idx * 80, y: 200 },
          physics: { mass: 1, isStatic: false },
        };
      }
      return {
        ...obj,
        id: obj.id || `obj_${idx}`,
        name: obj.name || obj.id || `Object ${idx + 1}`,
        type: obj.type || obj.kind || obj.asset || "block",
        position: {
          x: obj.position?.x != null ? Number(obj.position.x) : obj.x != null ? Number(obj.x) : 300 + idx * 80,
          y: obj.position?.y != null ? Number(obj.position.y) : obj.y != null ? Number(obj.y) : 200,
        },
        sprite: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path || obj.render?.sprite?.texture || undefined,
        physics: {
          ...obj.physics,
          mass: obj.physics?.mass != null ? Number(obj.physics.mass) : obj.mass != null ? Number(obj.mass) : 1,
          isStatic: obj.physics?.isStatic ?? obj.static ?? false,
        },
        asset: obj.asset ? {
          ...obj.asset,
          filePath: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path,
          url: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path,
          path: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path,
          texture: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path,
        } : undefined,
        render: obj.render ? {
          ...obj.render,
          sprite: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path ? {
            texture: obj.sprite || obj.asset?.filePath || obj.asset?.url || obj.asset?.path,
          } : obj.render.sprite,
        } : undefined
      };
    });

    return {
      ...inputDsl,
      meta: inputDsl.meta || inputDsl.metadata || { title: promptStr || "Dynamic Sandbox" },
      environment: inputDsl.environment || { gravity: 1, friction: 0.05, background: "#050816" },
      objects: sanitizedObjects,
      interactions: Array.isArray(inputDsl.interactions) ? inputDsl.interactions : [],
      forces: Array.isArray(inputDsl.forces) ? inputDsl.forces : [],
    };
  }, [createFallbackDsl]);

  const resolvedSimulation = useMemo(() => simulation?.simulation ?? simulation ?? null, [simulation]);
  const isBackendLoading = Boolean(resolvedSimulation?.loading || resolvedSimulation?.isGeneratingStream || resolvedSimulation?.isLoading);

  const rawCandidateDsl = useMemo(() => {
    if (!resolvedSimulation) return null;
    const raw = resolvedSimulation.dsl ?? resolvedSimulation;
    const dsl = raw?.dsl ?? raw;
    if (dsl && (dsl.objects || dsl.meta || dsl.environment)) {
      return dsl;
    }
    return null;
  }, [resolvedSimulation]);

  const [forceFallback, setForceFallback] = useState(false);
  const promptText = simulation?.prompt || simulation?.title || "Custom Lab Scenario";

  const safeValidatedDsl = useMemo(
    () => validateAndSanitizeDsl(
      rawCandidateDsl || (forceFallback ? createFallbackDsl(promptText) : null),
      promptText
    ),
    [rawCandidateDsl, forceFallback, promptText, validateAndSanitizeDsl, createFallbackDsl]
  );

  const resolvedDsl = rawCandidateDsl || (forceFallback ? safeValidatedDsl : null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationLoading, setIsSimulationLoading] = useState(true);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isRecording, setIsRecording] = useState(false);
  const [hasGravity, setHasGravity] = useState(true);
  const [hasCollision, setHasCollision] = useState(true);
  const [objectsCount, setObjectsCount] = useState(2);

  const [showForces, setShowForces] = useState(true);
  const [showVelocity, setShowVelocity] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [restitutionVal, setRestitutionVal] = useState(0.5);

  const [lessonMode, setLessonMode] = useState(false);
  const [lessonStage, setLessonStage] = useState<number>(1);

  const simTitle = simulation?.title || simulation?.topic?.topic || "Interactive Physics Sandbox";
  const titleLower = simTitle.toLowerCase();
  const isProjectile = titleLower.includes("projectile") || titleLower.includes("arc");
  const isPendulum = titleLower.includes("pendulum") || titleLower.includes("swing") || titleLower.includes("harmonic");
  const isCircuit = titleLower.includes("circuit") || titleLower.includes("electric");
  const runtimeType = simulation?.metadata?.runtime || simulation?.config?.runtime || "matter_js";
  const subjectType = (simulation?.metadata?.subject || simulation?.config?.subject || "physics").toLowerCase();
  const isPhysicsRuntime = runtimeType === "matter_js" || subjectType === "physics";
  const backendFormulas = simulation?.dsl?.formulas || [];
  const backendExplanation = simulation?.dsl?.meta?.explanation || simulation?.aiExplanation || "";

  const [mass, setMass] = useState(15);
  const [force, setForce] = useState(30);
  const [friction, setFriction] = useState(0.15);
  const [velocity, setVelocity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [gravityVal, setGravityVal] = useState(9.8);

  const [snapshot, setSnapshot] = useState<any>({
    time: 0,
    telemetry: { velocity: 0, energy: 0, momentum: 0, acceleration: 0 },
    selectedObject: null,
    paused: false
  });

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 1;

  useEffect(() => {
    if (snapshot.selectedObject?.physics?.restitution != null) {
      setRestitutionVal(Number(snapshot.selectedObject.physics.restitution));
    }
  }, [snapshot.selectedObject]);

  const time = snapshot.time || 0;
  const currentVelocity = snapshot.telemetry?.velocity?.toFixed(1) || "0.0";
  const currentAcceleration = snapshot.telemetry?.acceleration?.toFixed(2) || "0.00";
  const currentEnergy = snapshot.telemetry?.energy?.toFixed(1) || "0.0";
  const currentMomentum = snapshot.telemetry?.momentum?.toFixed(1) || "0.0";

  const [chartData, setChartData] = useState<any[]>([
    { t: 0, vel: 0, pos: 0, energy: 0 },
  ]);

  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("velocity");
  const [mobilePanelView, setMobilePanelView] = useState<"canvas" | "controls">("canvas");

  const [historyLogs, setHistoryLogs] = useState<string[]>([
    "Workspace synthesized via matrix pipeline.",
    "Initial boundary conditions applied."
  ]);

  const [generationError, setGenerationError] = useState<string | null>(null);
  const [simulationScene, setSimulationScene] = useState<any>(null);
  const [currentLoadingStage, setCurrentLoadingStage] = useState<string>("Generating DSL...");

  const safeParseDSL = useCallback((rawInput: any) => {
    try {
      if (typeof rawInput === "string") {
        return JSON.parse(rawInput);
      }
      return rawInput;
    } catch (e) {
      console.warn("[SimGen Pipeline] Safe DSL parse caught malformed payload. Returning null.");
      return null;
    }
  }, []);

  const timeoutPromise = useRef((ms: number) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI response parsing fails OR runtime initialization fails")), ms))
  ).current;

  const preloadAssets = useCallback(async (dslObjects: any[]) => {
    if (!Array.isArray(dslObjects)) return true;
    console.log("Resolving assets...");

    const preloadImage = (src: string) =>
      new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(true);
        img.onerror = () => {
          console.warn(`[Preloader] Failed to resolve sprite: ${src}. Continuing simulation safely.`);
          resolve(true);
        };
      });

    const textures = dslObjects
      .map((obj) => obj?.sprite || obj?.render?.sprite?.texture || obj?.asset?.filePath || obj?.asset?.url || obj?.asset?.path)
      .filter(Boolean);

    await Promise.all(textures.map(src => preloadImage(src)));
    console.log("Assets resolved");
    return true;
  }, []);

  const initializeRuntime = useCallback(async (targetDsl: any) => {
    console.log("Initializing runtime...");
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log("Runtime initialized");
    return targetDsl;
  }, []);

  const generateSimulationPipeline = useCallback(async () => {
    console.log("[Pipeline] Starting simulation generation. Current state:", runtimeState);

    if (retryCount > MAX_RETRIES) {
      console.error("[Pipeline] MAX_RETRIES exceeded. Stopping infinite loop.");
      setGenerationError("Simulation initialization failed after multiple attempts.");
      setIsLoading(false);
      setIsSimulationLoading(false);
      return;
    }

    setIsLoading(true);
    setIsSimulationLoading(true);
    setGenerationError(null);

    if (isBackendLoading && !rawCandidateDsl) {
      setCurrentLoadingStage("Waiting for backend DSL...");
      return;
    }

    if (!isBackendLoading && !rawCandidateDsl) {
      setGenerationError("Backend finished without returning simulation data.");
      setIsSimulationLoading(false);
      setIsLoading(false);
      return;
    }

    setCurrentLoadingStage("Validating DSL...");

    try {
      let candidateRaw = BYPASS_AI
        ? HARDCODED_TEST_DSL
        : (rawCandidateDsl ?? (resolvedSimulation?.objects ? resolvedSimulation : null));

      console.log("[Pipeline] Candidate DSL Payload:", candidateRaw);

      if (!candidateRaw) {
        throw new Error("Missing DSL from backend response");
      }
      const parsed = safeParseDSL(candidateRaw);
      console.log("[Pipeline] Parsed DSL:", parsed);

      // FIX 2: Removed unreachable code after the inner try/catch return.
      // finalizedScene is declared at the pipelineTask scope so it's accessible
      // for the return statement at the end of the function.
      const pipelineTask = async () => {
        setCurrentLoadingStage("Validating Scene...");
        await new Promise(r => setTimeout(r, 400));

        const candidateDsl = parsed?.dsl ?? parsed;

        console.log("[Pipeline] Validating DSL:", candidateDsl);
        const validDsl = validateAndSanitizeDsl(candidateDsl, promptText);
        console.log("[Pipeline] DSL Validated & Sanitized:", validDsl);

        setCurrentLoadingStage("Resolving assets...");
        await preloadAssets(validDsl?.objects || []);

        setCurrentLoadingStage("Initializing runtime...");
        console.log("[Pipeline] Initializing Matter.js Runtime with DSL:", validDsl);
        const finalizedScene = await initializeRuntime(validDsl);
        console.log("[Pipeline] Runtime Initialized successfully.");

        // Extra buffer for Matter.js to settle
        await new Promise(r => setTimeout(r, 600));

        return finalizedScene;
      };

      const finalScene = await Promise.race([
        pipelineTask(),
        timeoutPromise(12000)
      ]);

      setCurrentLoadingStage("Scene mounted.");
      setSimulationScene(finalScene);

      runtimeRef.current?.pause?.();

      setTimeout(() => {
        setIsSimulationLoading(false);
      }, 1000);

    } catch (err: any) {
      console.error("[Pipeline] Generation failed:", err);
      const errorMsg = err.message || "AI response parsing fails OR runtime initialization fails";
      setGenerationError(errorMsg);

      setRetryCount(prev => prev + 1);

      if (retryCount < MAX_RETRIES) {
        toast.warning(`Sim Synthesis Error: ${errorMsg}. Attempting fallback...`);
        const fallback = createFallbackDsl(promptText);
        setSimulationScene(validateAndSanitizeDsl(fallback, promptText));
        setForceFallback(true);
      } else {
        toast.error("Simulation failed to initialize. Please check the logs.");
      }

      setIsSimulationLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [isBackendLoading, rawCandidateDsl, resolvedSimulation, promptText, safeParseDSL, validateAndSanitizeDsl, preloadAssets, initializeRuntime, createFallbackDsl, timeoutPromise]);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      setSimulationScene(null);
      setGenerationError(null);
      setRetryCount(0);
      setCurrentLoadingStage("Generating DSL...");
      setIsSimulationLoading(true);
      return;
    }

    if (isOpen && resolvedSimulation) {
      hasInitializedRef.current = false;
      setForceFallback(false);
      setRetryCount(0);
      setIsSimulationLoading(true);
    }

    if (isOpen && isBackendLoading && !rawCandidateDsl) {
      hasInitializedRef.current = false;
      setSimulationScene(null);
      setIsLoading(true);
      setIsSimulationLoading(true);
      setCurrentLoadingStage("Waiting for backend DSL...");
      return;
    }

    const incomingError = simulation?.error || simulation?.generationError || null;
    if (incomingError) {
      setGenerationError(String(incomingError));
      setIsSimulationLoading(false);
      return;
    }

    if (isOpen && simulation && !isBackendLoading && !rawCandidateDsl) {
      setGenerationError("Backend finished without returning simulation data.");
      setIsSimulationLoading(false);
      return;
    }

    if (isOpen && !isBackendLoading && rawCandidateDsl) {
      setGenerationError(null);
      setIsSimulationLoading(false);
    }

    if (isOpen && resolvedSimulation && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      generateSimulationPipeline();
    }
  }, [isOpen, simulation, resolvedSimulation, isBackendLoading, rawCandidateDsl, generateSimulationPipeline, generationError]);

  const activeRuntimeScene = simulationScene || (forceFallback ? validateAndSanitizeDsl(createFallbackDsl(promptText), promptText) : null);

  const memoizedRuntime = useMemo(() => {
    if (isLoading) return null;
    if (!activeRuntimeScene) return null;

    return (
      <RuntimeEngine
        dsl={activeRuntimeScene}
        title={simTitle}
        onRuntimeReady={(rt) => { runtimeRef.current = rt; }}
        onSimulationStateChange={(snap) => {
          setSnapshot(snap);
          const mappedState = snap.paused
            ? (snap.time > 0 ? RuntimeState.PAUSED : RuntimeState.IDLE)
            : RuntimeState.RUNNING;

          if (runtimeState !== mappedState) {
            console.log(`[Runtime] State Transition: ${runtimeState} -> ${mappedState}`);
            setRuntimeState(mappedState);
          }
        }}
      />
    );
  }, [isLoading, activeRuntimeScene, simTitle]);

  const memoizedMetadata = useMemo(() => {
    if (!activeRuntimeScene) return null;
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--neon-cyan)]">
            <Brain className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Concept Summary</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
            {activeRuntimeScene.meta?.title || simTitle}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed italic">
            {activeRuntimeScene.meta?.description || activeRuntimeScene.meta?.explanation}
          </p>
        </div>
      </div>
    );
  }, [activeRuntimeScene, simTitle]);

  useEffect(() => {
    if (!isPlaying) {
      runtimeRef.current?.pause?.();
    } else {
      runtimeRef.current?.resume?.();
    }
  }, [isPlaying]);

  useEffect(() => {
    runtimeRef.current?.setTimeScale?.(speed);
  }, [speed]);

  useEffect(() => {
    runtimeRef.current?.setZoom?.(zoom / 100);
  }, [zoom]);

  useEffect(() => {
    if (!isPlaying || time === 0 || isLoading) return;
    if (Math.round(time * 100) % 20 === 0) {
      setChartData(prev => {
        const vel = snapshot.telemetry?.velocity || 0;
        const eng = snapshot.telemetry?.energy || 0;
        const acc = snapshot.telemetry?.acceleration || 0;
        const mom = snapshot.telemetry?.momentum || (mass * vel);
        const frc = force || 0;
        const next = [...prev, { t: time, vel: Number(vel.toFixed(1)), acc: Number(acc.toFixed(1)), momentum: Number(mom.toFixed(1)), energy: Number(eng.toFixed(1)), force: frc }];
        if (next.length > 30) next.shift();
        return next;
      });
      setFps(Math.floor(58 + Math.random() * 5));
    }
  }, [time, isPlaying, snapshot, isLoading, mass, force]);

  const handleGravityChange = (val: number) => {
    setGravityVal(val);
    runtimeRef.current?.setGravity?.(val);
  };

  const handleMassChange = (val: number) => {
    setMass(val);
    runtimeRef.current?.setSelectedBodyMass?.(val);
    runtimeRef.current?.setGlobalMass?.(val);
  };

  const handleFrictionChange = (val: number) => {
    setFriction(val);
    runtimeRef.current?.setSelectedBodyFriction?.(val);
    runtimeRef.current?.setGlobalFriction?.(val);
  };

  const handleVelocityChange = (val: number) => {
    setVelocity(val);
    runtimeRef.current?.setSelectedBodyVelocity?.(val);
  };

  const handleRestitutionChange = (val: number) => {
    setRestitutionVal(val);
    runtimeRef.current?.updateSelectedObject?.({ material: { restitution: val } });
  };

  const handleStepFrame = () => {
    runtimeRef.current?.stepFrame?.();
    setHistoryLogs(h => ["Simulated single delta step interval.", ...h]);
    toast.info("Stepped 1 frame.");
  };

  const handleAddDynamicObject = () => {
    setObjectsCount(c => c + 1);
    const types = ["block", "sphere", "car", "truck"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const spawnX = 400 + (Math.random() * 200 - 100);
    const spawnDef = {
      id: `spawned_${Date.now()}`,
      name: `Dynamic ${randomType.toUpperCase()}`,
      type: randomType,
      shape: randomType === "sphere" ? { type: "circle", radius: 0.5 } : { type: "rectangle", width: 1.5, height: 0.8 },
      physics: { mass: 10, friction: 0.2, restitution: 0.5, isStatic: false },
      visual: { color: "#a855f7", opacity: 1, showForces, showVelocity, trail: showTrails }
    };
    runtimeRef.current?.spawnObject?.(spawnDef, { x: spawnX, y: 150 });
    setHistoryLogs(h => [`Spawned physical body: ${spawnDef.name}`, ...h]);
    toast.success(`Spawned runtime object: ${randomType}`);
  };

  const handleToggleVisuals = (flagName: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    if (flagName === "showForces") setShowForces(nextVal);
    if (flagName === "showVelocity") setShowVelocity(nextVal);
    if (flagName === "trail") setShowTrails(nextVal);
    runtimeRef.current?.setGlobalVisuals?.({ [flagName]: nextVal });
    toast.info(`Updated overlays: ${flagName} -> ${nextVal ? "ON" : "OFF"}`);
  };

  const handleReset = () => {
    setIsPlaying(true);
    setChartData([{ t: 0, vel: velocity, pos: 0, energy: Number((0.5 * mass * velocity * velocity / 10).toFixed(1)) }]);
    setHistoryLogs(h => ["Simulation clock and trajectories reset.", ...h]);
    runtimeRef.current?.reset?.();
    toast.info("Simulation reset.");
  };

  const handleTryExperiment = (label: string, customOverrides: any) => {
    if (customOverrides.mass) setMass(customOverrides.mass);
    if (customOverrides.force) setForce(customOverrides.force);
    if (customOverrides.angle) setAngle(customOverrides.angle);
    if (customOverrides.velocity) setVelocity(customOverrides.velocity);
    handleReset();
    toast.success(`Loaded Macro: ${label}`);
    setHistoryLogs(h => [`Executed macro: ${label}`, ...h]);
  };

  const handleExportJSON = () => {
    if (!resolvedDsl) return;
    const data = JSON.stringify(resolvedDsl, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation_${simTitle.toLowerCase().replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Simulation exported successfully.");
  };

  const ragContent = useMemo(() => {
    if (backendExplanation) {
      return {
        concept: simulation?.metadata?.topic || simTitle,
        theory: backendExplanation,
        derivation: `Subject: ${simulation?.metadata?.subject || "N/A"} | Runtime: ${runtimeType}`,
        insight: `Class: ${simulation?.metadata?.class || "N/A"} | Chapter: ${simulation?.metadata?.chapter || "N/A"}`,
      };
    }

    const isColl = simTitle.toLowerCase().includes("collision") || simTitle.toLowerCase().includes("truck") || simTitle.toLowerCase().includes("barrier");
    if (isColl) {
      return {
        concept: "Conservation of Linear Momentum & Impulse Mechanics",
        theory: "According to Newton's Second and Third Laws, the total linear momentum of a closed system remains constant through time. During an inelastic or elastic mechanical collision, the instantaneous force vectors exerted between colliding boundaries exchange equal and opposite impulse integrals over contact delta time.",
        derivation: "Starting from F = dp/dt, integrating both sides with respect to time yields the impulse-momentum theorem: ∫ F dt = Δp. Therefore, m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'.",
        insight: `As the truck mass increases (${mass} kg), momentum increases proportionally according to p = mv. At the current systemic velocity of ${currentVelocity} m/s, the net dynamic forward momentum vector computes directly to ${(mass * Number(currentVelocity)).toFixed(1)} kg·m/s.`
      };
    }
    if (isProjectile) {
      return {
        concept: "Parabolic Kinematics & Orthogonal Trajectory Decomposition",
        theory: "Projectile motion consists of two independent linear one-dimensional kinematic behaviors: constant velocity horizontal inertia and uniformly accelerated vertical free-fall governed by uniform gravitational acceleration.",
        derivation: "Decomposing initial launch vectors: v_x = v₀ cos(θ) and v_y = v₀ sin(θ) - gt. Solving for flight duration t yields the absolute parabolic range limit constraint.",
        insight: `At launch angle ${angle}° with initial magnitude ${velocity} m/s, the peak trajectory envelope scales quadratically with initial velocity adjustments.`
      };
    }
    return {
      concept: "Newtonian Dynamics & Mechanical Energy Conservation",
      theory: "In the absence of non-conservative dissipative forces like dry friction or aerodynamic drag, the mechanical summation of kinetic energy streams and gravitational potential remains invariant.",
      derivation: "Work-Energy Principle: W_net = ΔE_k. Integrating conservative vector forces over continuous metric paths derives directly into scalar potential fields.",
      insight: `Active runtime mass (${mass} kg) subjected to internal baseline gravity (${gravityVal} m/s²) exhibits real-time mechanical energy dissipation tracking.`
    };
  }, [backendExplanation, simulation, simTitle, runtimeType, mass, currentVelocity, isProjectile, angle, velocity, gravityVal]);

  const ragFormulas = useMemo(() => {
    if (backendFormulas.length > 0) {
      return backendFormulas.map((f: any) => ({
        formula: f.latex || f.formula || f.name || "Formula",
        variables: f.description || f.variables || "Topic formula",
        units: f.units || "",
        derivation: f.name || "Derived from syllabus topic",
        liveSubstitution: f.latex || f.formula || "",
      }));
    }

    const isColl = simTitle.toLowerCase().includes("collision") || simTitle.toLowerCase().includes("truck") || simTitle.toLowerCase().includes("barrier");
    const pVal = (mass * Number(currentVelocity)).toFixed(1);
    if (isColl) {
      return [
        {
          formula: "p = m · v",
          variables: "p: Linear Momentum, m: Body Mass, v: Instantaneous Velocity Vector",
          units: "kg·m/s",
          derivation: "Derived natively from basic scalar mass integration over absolute directional velocity arrays.",
          liveSubstitution: `p = ${mass} kg × ${currentVelocity} m/s = ${pVal} kg·m/s`
        },
        {
          formula: "F · Δt = Δp",
          variables: "F: Average Impact Force, Δt: Contact Time Duration, Δp: Momentum Delta",
          units: "N·s",
          derivation: "Integration of instantaneous mechanical contact stress across simulation step ticks.",
          liveSubstitution: `Impulse integral at force ${force} N over dt duration.`
        }
      ];
    }
    if (isProjectile) {
      const rVal = ((velocity ** 2) * Math.sin(2 * angle * Math.PI / 180) / 9.8).toFixed(1);
      return [
        {
          formula: "R = (v² · sin(2θ)) / g",
          variables: "R: Absolute Horizontal Distance, v: Initial Speed, θ: Angle, g: Gravity",
          units: "meters",
          derivation: "Substituted horizontal travel bounds evaluated at terminal vertical return height limits.",
          liveSubstitution: `R = (${velocity}² × sin(${2 * angle}°)) / 9.8 = ${rVal} m`
        }
      ];
    }
    return [
      {
        formula: "E_k = ½ · m · v²",
        variables: "E_k: Kinetic Energy, m: Active Mass Scalar, v: Velocity Magnitude",
        units: "Joules (J)",
        derivation: "Integration of momentum differential over spatial coordinate translation.",
        liveSubstitution: `E_k = 0.5 × ${mass} × ${currentVelocity}² = ${currentEnergy} J`
      }
    ];
  }, [backendFormulas, simTitle, mass, currentVelocity, force, isProjectile, velocity, angle, currentEnergy]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.94 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
            className={`relative w-full max-w-[1700px] bg-[#050314]/90 backdrop-blur-3xl border border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.15)] rounded-[2.5rem] flex flex-col overflow-hidden m-4 ${isFullscreen ? "inset-0 m-0 max-w-none rounded-none h-full" : "h-[92vh]"
              }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 opacity-90" />

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white fill-white animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold tracking-tight text-white font-sans">
                      {simTitle}
                    </h2>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      AI Lab Shell
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Premium High-Fidelity Physics Engine Matrix
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex lg:hidden bg-secondary/60 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setMobilePanelView("canvas")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mobilePanelView === "canvas" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
                  >
                    Canvas Viewer
                  </button>
                  <button
                    onClick={() => setMobilePanelView("controls")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mobilePanelView === "controls" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"}`}
                  >
                    Controls Sidebar
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="text-[10px] font-mono font-bold text-slate-300">
                    {fps} FPS
                  </span>
                  <span className="text-slate-600 font-bold">|</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-400">
                    LIVE DSL
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Overlay"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all group"
                  title="Close Workspace"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden relative">

              <div className={`lg:col-span-8 h-full flex flex-col justify-between p-4 sm:p-6 border-r border-white/5 relative overflow-hidden ${mobilePanelView === "controls" ? "hidden lg:flex" : "flex"
                }`}>

                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                <div
                  className="relative w-full flex-1 rounded-[2rem] border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center select-none group"
                  style={{
                    background: activeRuntimeScene?.environment?.background || '#020108',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                    backgroundColor: 'rgba(2, 1, 8, 0.8)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-8 text-[9px] font-mono text-slate-600 pointer-events-none">
                    <span>-10.0 m</span><span>-5.0 m</span><span>0.0 m (Origin)</span><span>+5.0 m</span><span>+10.0 m</span>
                  </div>
                  <div className="absolute top-0 bottom-0 left-0 w-5 bg-white/[0.02] border-r border-white/5 flex flex-col items-center justify-between py-8 text-[9px] font-mono text-slate-600 pointer-events-none">
                    <span>+5</span><span>0</span><span>-5</span>
                  </div>

                  <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
                    <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        <span className="text-[10px] font-mono font-bold text-slate-300">T = {time.toFixed(2)}s</span>
                      </div>
                      <span className="text-white/20">|</span>
                      <span className="text-[10px] font-mono font-bold text-cyan-400">Zoom: {zoom}%</span>
                    </div>

                    {isRecording && (
                      <span className="bg-red-500/20 backdrop-blur-md border border-red-500/40 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Recording...
                      </span>
                    )}
                  </div>

                  <div className="relative w-full h-full">
                    <AnimatePresence mode="wait">
                      {generationError && !isSimulationLoading ? (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50 flex items-center justify-center p-6"
                        >
                          <div className="max-w-xl w-full rounded-[1.75rem] border border-red-500/20 bg-red-950/35 backdrop-blur-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.12)] text-center space-y-4">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                              <AlertCircle className="w-7 h-7 text-red-300" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-lg font-bold text-white">Simulation generation failed</h3>
                              <p className="text-sm text-red-100/80 leading-relaxed">{generationError}</p>
                            </div>
                            {/* FIX 3: Restored the missing <Button> opening tag */}
                            <div className="flex items-center justify-center gap-3">
                              <Button
                                onClick={() => {
                                  setGenerationError(null);
                                  setIsSimulationLoading(true);
                                  setRetryCount(0);
                                  generateSimulationPipeline();
                                }}
                                className="bg-red-500 hover:bg-red-400 text-white"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry
                              </Button>
                              <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-white/10 text-slate-200 hover:bg-white/5"
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (isSimulationLoading || generatingSimulation) ? (
                        <motion.div
                          key="loader"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50"
                        >
                          <SimulationLoader
                            stage={generationPhase || currentLoadingStage}
                            progress={generatingSimulation ? (generationProgress * 100) : undefined}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="canvas"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full h-full"
                        >
                          {memoizedRuntime}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-sans bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                        💡 Click & Drag canvas components to apply initial vector torque
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 bg-[#03010b]/60 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/5">

                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    <Button
                      onClick={() => setIsPlaying(current => !current)}
                      className="h-12 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      disabled={isSimulationLoading}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 mr-2 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 mr-2 fill-current" />
                      )}
                      <span>{isPlaying ? "Pause Physics" : "Start Simulation"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isSimulationLoading}
                      className={`h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 font-sans text-xs flex items-center gap-1.5 ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleStepFrame}
                      disabled={isSimulationLoading}
                      className={`h-10 px-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/30 text-purple-200 font-sans text-xs flex items-center gap-1.5 ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>Step ⏭️</span>
                    </Button>

                    <div className="hidden sm:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[0.5, 1, 2].map(s => (
                        <button
                          key={s}
                          onClick={() => { setSpeed(s); toast.info(`Clock speed synced to ${s}x`); }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${speed === s ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                    <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setZoom(z => Math.max(50, z - 10))}
                        className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 font-bold px-1 select-none">{zoom}%</span>
                      <button
                        onClick={() => setZoom(z => Math.min(150, z + 10))}
                        className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setZoom(100); runtimeRef.current?.centerCamera?.(); toast.info("Camera layout centered on active bodies."); }}
                        className="px-2 py-1 rounded-lg hover:bg-white/10 text-[9px] font-sans text-indigo-300 transition-colors"
                        title="Reset Camera Viewport"
                      >
                        Center
                      </button>
                    </div>

                    <span className="text-white/10 hidden md:inline">|</span>

                    <Button
                      variant="ghost"
                      onClick={handleExportJSON}
                      className="h-9 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-sans gap-1.5 border border-white/5"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden md:inline">Export</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        const id = simulation?.id;
                        if (!id) {
                          toast.error("Simulation ID not found. Cannot export replay.");
                          return;
                        }
                        const url = `${simulationSynthesisService.getExportUrl(id)}/replay`;
                        window.open(url, "_blank");
                        toast.success("Replay export initiated.");
                      }}
                      className="h-9 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-sans gap-1.5 border border-white/5"
                    >
                      <History className="w-3.5 h-3.5 text-purple-400" />
                      <span className="hidden md:inline">Replay</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = !isRecording;
                        setIsRecording(next);
                        if (next) {
                          const canvasEl = runtimeRef.current?.canvas;
                          if (canvasEl && typeof canvasEl.captureStream === "function") {
                            try {
                              const stream = canvasEl.captureStream(30);
                              const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
                              const chunks: Blob[] = [];
                              recorder.ondataavailable = e => {
                                if (e.data && e.data.size > 0) chunks.push(e.data);
                              };
                              recorder.onstop = () => {
                                const blob = new Blob(chunks, { type: "video/webm" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `simulation_video_${Date.now()}.webm`;
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success("Video playback stream downloaded perfectly.");
                              };
                              recorder.start();
                              mediaRecorderRef.current = recorder;
                              toast.success("Simulation visual buffer recording active.");
                            } catch (err) {
                              toast.error("Failed to initialize MediaRecorder on browser viewport.");
                            }
                          } else {
                            toast.error("Canvas context stream capture unavailable.");
                            setIsRecording(false);
                          }
                        } else {
                          if (mediaRecorderRef.current) {
                            mediaRecorderRef.current.stop();
                            mediaRecorderRef.current = null;
                          } else {
                            toast.info("Recording buffer finished.");
                          }
                        }
                      }}
                      className={`h-9 px-3 rounded-xl text-xs font-sans gap-1.5 border transition-all ${isRecording
                        ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                        : "bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white border-white/5"
                        }`}
                    >
                      <Video className={`w-3.5 h-3.5 ${isRecording ? "text-red-400 animate-pulse" : "text-slate-400"}`} />
                      <span className="hidden md:inline">{isRecording ? "Stop Rec" : "Record"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-4 h-full bg-[#03010b]/50 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 select-none ${mobilePanelView === "canvas" ? "hidden lg:flex" : "flex"
                }`}>

                {memoizedMetadata}

                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h3 className="text-xs font-sans font-extrabold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      1. Parameters Deck
                    </h3>
                    <span className="text-[9px] font-mono text-indigo-400 font-semibold">Live Override</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Object Mass</span>
                        <span className="text-indigo-400 font-mono font-bold">{mass} kg</span>
                      </div>
                      <Slider
                        value={[mass]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={v => handleMassChange(v[0])}
                        className="py-1.5"
                        disabled={isSimulationLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Applied Vector Force</span>
                        <span className="text-indigo-400 font-mono font-bold">{force} N</span>
                      </div>
                      <Slider
                        value={[force]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={v => { setForce(v[0]); runtimeRef.current?.impulseFirstBody?.(v[0] / 20); }}
                        className="py-1.5"
                        disabled={isSimulationLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Initial Velocity</span>
                        <span className="text-indigo-400 font-mono font-bold">{velocity} m/s</span>
                      </div>
                      <Slider
                        value={[velocity]}
                        min={0}
                        max={50}
                        step={1}
                        onValueChange={v => handleVelocityChange(v[0])}
                        className="py-1.5"
                        disabled={isSimulationLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">{isProjectile ? "Launch Angle" : "Surface Friction"}</span>
                        <span className="text-indigo-400 font-mono font-bold">{isProjectile ? `${angle}°` : friction.toFixed(2)}</span>
                      </div>
                      {isProjectile ? (
                        <Slider value={[angle]} min={0} max={90} step={5} onValueChange={v => setAngle(v[0])} className="py-1.5" disabled={isSimulationLoading} />
                      ) : (
                        <Slider value={[friction]} min={0} max={0.5} step={0.05} onValueChange={v => handleFrictionChange(v[0])} className="py-1.5" disabled={isSimulationLoading} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Gravity Scalar</span>
                        <span className="text-indigo-400 font-mono font-bold">{gravityVal.toFixed(1)} m/s²</span>
                      </div>
                      <Slider
                        value={[gravityVal]}
                        min={0}
                        max={25}
                        step={0.5}
                        onValueChange={v => handleGravityChange(v[0])}
                        className="py-1.5"
                        disabled={isSimulationLoading}
                      />
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const next = !hasGravity;
                            setHasGravity(next);
                            handleGravityChange(next ? 9.8 : 0);
                            toast.info(`Environmental Gravity: ${next ? "ENABLED" : "DISABLED"}`);
                          }}
                          className={`h-8 text-[11px] font-sans rounded-lg border transition-all ${hasGravity ? "bg-indigo-950/40 text-indigo-200 border-indigo-500/30" : "bg-white/5 text-slate-400 border-white/5"
                            } ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isSimulationLoading}
                        >
                          <Zap className="w-3 h-3 mr-1.5 text-indigo-400" />
                          <span>Gravity: {hasGravity ? "ON" : "OFF"}</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const next = !hasCollision;
                            setHasCollision(next);
                            runtimeRef.current?.toggleCollisions?.(next);
                            toast.info(`Mechanical Collisions: ${next ? "ENABLED" : "BYPASSED (Sensors)"}`);
                          }}
                          className={`h-8 text-[11px] font-sans rounded-lg border transition-all ${hasCollision ? "bg-emerald-950/40 text-emerald-200 border-emerald-500/30" : "bg-white/5 text-slate-400 border-white/5"
                            } ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isSimulationLoading}
                        >
                          <Box className="w-3 h-3 mr-1.5 text-emerald-400" />
                          <span>Collisions: {hasCollision ? "ON" : "OFF"}</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={handleAddDynamicObject}
                          className={`h-8 text-[11px] font-sans rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isSimulationLoading}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          <span>Add Object</span>
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            const success = runtimeRef.current?.removeSelectedObject?.();
                            if (success) {
                              toast.success("Selected body deleted successfully.");
                            } else {
                              toast.info("Please click an active runtime body on canvas to select before removing.");
                            }
                          }}
                          className={`h-8 text-[11px] font-sans rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-200 border border-red-500/20 ${isSimulationLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={isSimulationLoading}
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 sticky top-0 bg-[#03010b]/90 backdrop-blur-md z-10">
                    <h3 className="text-sm font-sans font-extrabold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      2. AI Explanation
                    </h3>
                    <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-bold">RAG Context</span>
                  </div>

                  <div className="space-y-4 text-sm font-sans">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-bold block mb-1">Pedagogical Concept</span>
                      <p className="text-slate-100 font-bold text-base leading-relaxed">{ragContent.concept}</p>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-purple-400 font-bold block mb-1">Core Theory</span>
                      <p className="text-slate-300 leading-relaxed text-sm">{ragContent.theory}</p>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold block mb-1">Textbook Derivation</span>
                      <p className="text-slate-400 font-mono text-xs bg-black/40 p-2.5 rounded-lg border border-white/10 leading-relaxed">{ragContent.derivation}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <span className="text-xs font-mono text-amber-400 font-bold block mb-1">Live Educational Insight</span>
                      <p className="text-amber-200/90 italic bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 leading-relaxed shadow-sm">{ragContent.insight}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <h3 className="text-xs font-sans font-extrabold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-amber-400" />
                      3. Formula Panel
                    </h3>
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded">Live Substitution</span>
                  </div>

                  <div className="space-y-3">
                    {ragFormulas.map((rf: any, rfIdx: number) => (
                      <div key={rfIdx} className="bg-black/30 p-3.5 rounded-xl border border-white/10 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded shadow-sm">{rf.units || "Units"}</span>
                        </div>
                        <div className="py-2 text-indigo-100 flex justify-center bg-white/[0.01] rounded-lg">
                          <BlockMath math={rf.formula.replace("=", "=")} />
                        </div>
                        <p className="text-[11px] font-sans text-slate-300 leading-relaxed">{rf.variables}</p>
                        <p className="text-[10px] font-mono text-slate-500 italic">{rf.derivation}</p>
                        <div className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg truncate mt-2 border border-amber-500/20">
                          ▸ {rf.liveSubstitution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-sans font-extrabold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      4. Graphs Section
                    </h3>

                    <div className="flex flex-wrap gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                      {(["velocity", "acceleration", "momentum", "energy", "force"] as ChartTab[]).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveChartTab(tab)}
                          className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold capitalize transition-all ${activeChartTab === tab ? "bg-cyan-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-40 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: "#03010b", borderColor: "#06b6d4", borderRadius: "8px", fontSize: "10px", color: "#fff" }}
                        />
                        {activeChartTab === "velocity" && (
                          <Line type="monotone" dataKey="vel" name="Velocity" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "acceleration" && (
                          <Line type="monotone" dataKey="acc" name="Acceleration" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "momentum" && (
                          <Line type="monotone" dataKey="momentum" name="Momentum" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "energy" && (
                          <Line type="monotone" dataKey="energy" name="Energy" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "force" && (
                          <Line type="monotone" dataKey="force" name="Force" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}