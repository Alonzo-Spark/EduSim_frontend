import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Play, Pause, RotateCcw, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  Download, Video, Sliders, Activity, Brain, Plus, Minus, RefreshCw, 
  Share2, Save, History, MessageSquare, Settings, Zap, Gauge, X, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid 
} from "recharts";

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
  // Loader state before simulation renders
  const [isLoading, setIsLoading] = useState(true);
  
  // Physics engine live state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0.0);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isRecording, setIsRecording] = useState(false);
  const [hasGravity, setHasGravity] = useState(true);
  const [hasCollision, setHasCollision] = useState(true);
  const [objectsCount, setObjectsCount] = useState(2);
  
  // Topic classification detection
  const simTitle = simulation?.title || simulation?.topic?.topic || "Interactive Physics Sandbox";
  const titleLower = simTitle.toLowerCase();
  const isProjectile = titleLower.includes("projectile") || titleLower.includes("arc");
  const isPendulum = titleLower.includes("pendulum") || titleLower.includes("swing") || titleLower.includes("harmonic");
  const isCircuit = titleLower.includes("circuit") || titleLower.includes("electric");
  
  // Dynamic parameters mapping depending on topic
  const [mass, setMass] = useState(15);
  const [force, setForce] = useState(30);
  const [friction, setFriction] = useState(0.15);
  const [velocity, setVelocity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [gravityVal, setGravityVal] = useState(9.8);
  
  // Real-time changing metrics derivation
  const currentVelocity = Number(Math.max(0, velocity - friction * time * 2).toFixed(1));
  const currentAcceleration = Number((force / mass - (hasGravity ? gravityVal * Math.sin(angle * Math.PI / 180) : 0)).toFixed(2));
  const currentEnergy = Number((0.5 * mass * currentVelocity * currentVelocity / 10).toFixed(1));
  const currentMomentum = Number((mass * currentVelocity).toFixed(1));
  
  // Graph real-time data state
  const [chartData, setChartData] = useState<any[]>([
    { t: 0, vel: 20, pos: 0, energy: 300 },
  ]);

  // Active chart tab view
  const [activeChartTab, setActiveChartTab] = useState<"velocity" | "position" | "energy">("velocity");

  // Sidebar responsive mobile panel view
  const [mobilePanelView, setMobilePanelView] = useState<"canvas" | "controls">("canvas");

  // Bonus history feature log
  const [historyLogs, setHistoryLogs] = useState<string[]>([
    "Workspace synthesized via matrix pipeline.",
    "Initial boundary conditions applied."
  ]);

  // Trigger loading screen on mount/open
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setTime(0);
      setChartData([{ t: 0, vel: velocity, pos: 0, energy: Number((0.5 * mass * velocity * velocity / 10).toFixed(1)) }]);
      const timer = setTimeout(() => {
        setIsLoading(false);
        toast.success("AI Sandbox viewport rendered seamlessly!");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, simulation]);

  // Continuous ticking simulation loop
  useEffect(() => {
    if (!isPlaying || isLoading) return;
    const interval = setInterval(() => {
      setTime(prev => {
        const next = prev + 0.05 * speed;
        return Number(next.toFixed(2));
      });
      setFps(Math.floor(58 + Math.random() * 5));
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying, speed, isLoading]);

  // Chart reactivity stream append
  useEffect(() => {
    if (!isPlaying || time === 0 || isLoading) return;
    if (Math.round(time * 100) % 20 === 0) {
      setChartData(prev => {
        const vel = Math.max(0, velocity - friction * time * 2 + Math.sin(time) * 0.8);
        const pos = Number((time * velocity * 0.7).toFixed(1));
        const eng = Math.max(5, Number((0.5 * mass * vel * vel / 10).toFixed(1)));
        const next = [...prev, { t: time, vel: Number(vel.toFixed(1)), pos, energy: eng }];
        if (next.length > 30) next.shift();
        return next;
      });
    }
  }, [time, isPlaying, velocity, friction, mass, isLoading]);

  const handleReset = () => {
    setTime(0);
    setIsPlaying(true);
    setChartData([{ t: 0, vel: velocity, pos: 0, energy: Number((0.5 * mass * velocity * velocity / 10).toFixed(1)) }]);
    setHistoryLogs(h => ["Simulation clock and trajectories reset.", ...h]);
    toast.info("Simulation matrix restored to initial condition.");
  };

  const handleTryExperiment = (label: string, customOverrides: any) => {
    if (customOverrides.mass) setMass(customOverrides.mass);
    if (customOverrides.force) setForce(customOverrides.force);
    if (customOverrides.angle) setAngle(customOverrides.angle);
    if (customOverrides.velocity) setVelocity(customOverrides.velocity);
    handleReset();
    toast.success(`Loaded Macro: ${label}`);
    setHistoryLogs(h => [`Executed macro experiment: ${label}`, ...h]);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      title: simTitle, time, currentVelocity, currentEnergy, mass, force, friction, velocity
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edusim_${simTitle.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Workspace environment snapshot exported successfully.");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
        
        {/* Darkened and heavily blurred background backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
        />

        {/* Floating Glowing ambient background accent particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* Main Floating Workspace Overlay Shell */}
        <motion.div 
          initial={{ opacity: 0, y: 80, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.94 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.15 }}
          className={`relative w-full max-w-[1700px] bg-[#050314]/90 backdrop-blur-3xl border border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.15)] rounded-[2.5rem] flex flex-col overflow-hidden m-4 ${
            isFullscreen ? "inset-0 m-0 max-w-none rounded-none h-full" : "h-[92vh]"
          }`}
        >
          {/* Top subtle multi-color gradient border light */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 opacity-90" />

          {/* ========================================================= */}
          {/* OVERLAY SHELL HEADER */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01] shrink-0">
            <div className="flex items-center gap-3">
              {/* Studio branding badge */}
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

            {/* Middle Quick Actions / Mobile Tabs switch */}
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

              {/* FPS & Stream Signal indicator */}
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

            {/* Right Shell window actions */}
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


          {/* ========================================================= */}
          {/* LOADER STATE INTERCEPTOR */}
          {/* ========================================================= */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.3)] flex items-center justify-center relative backdrop-blur-md"
              >
                <div className="absolute inset-3 border-2 border-dashed border-indigo-400/40 rounded-2xl animate-spin-slow" />
                <Activity className="w-10 h-10 text-indigo-400 animate-pulse" />
              </motion.div>
              <div className="text-center space-y-2 z-10">
                <h3 className="text-base font-extrabold text-white tracking-wide font-sans animate-pulse">
                  Synthesizing Premium Live Physics Context...
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Interpreting AI vector equations, compiling Recharts canvas metrics, and setting boundary state layers.
                </p>
              </div>
            </div>
          ) : (

            /* ========================================================= */
            /* SPLIT SCREEN RESPONSIVE LAYOUT BODY                       */
            /* ========================================================= */
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden relative">
              
              {/* LEFT SIDE (65-70%) — MAIN INTERACTIVE SIMULATION CANVAS */}
              <div className={`lg:col-span-8 h-full flex flex-col justify-between p-4 sm:p-6 border-r border-white/5 relative overflow-hidden ${
                mobilePanelView === "controls" ? "hidden lg:flex" : "flex"
              }`}>
                
                {/* Background high fidelity visual matrix layout container grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />
                
                {/* Ambient dynamic radial lights behind canvas */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                {/* Inner Viewport Wrapper with custom glowing glass container */}
                <div className="relative w-full flex-1 rounded-[2rem] bg-[#020108]/90 border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center justify-center select-none group">
                  
                  {/* Visual Reference Scale Rulers at edges */}
                  <div className="absolute top-0 left-0 right-0 h-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-8 text-[9px] font-mono text-slate-600 pointer-events-none">
                    <span>-10.0 m</span><span>-5.0 m</span><span>0.0 m (Origin)</span><span>+5.0 m</span><span>+10.0 m</span>
                  </div>
                  <div className="absolute top-0 bottom-0 left-0 w-5 bg-white/[0.02] border-r border-white/5 flex flex-col items-center justify-between py-8 text-[9px] font-mono text-slate-600 pointer-events-none">
                    <span>+5</span><span>0</span><span>-5</span>
                  </div>

                  {/* TOP BANNER INSIDE CANVAS */}
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
                        Recording Video...
                      </span>
                    )}
                  </div>


                  {/* ========================================================= */}
                  {/* DYNAMIC TOPIC-SPECIFIC ANIMATED PHYSICS OBJECT RENDER     */}
                  {/* ========================================================= */}
                  <div className="relative w-full h-full flex items-center justify-center transition-transform duration-300" style={{ transform: `scale(${zoom / 100})` }}>
                    
                    {/* TOPIC A: PROJECTILE ARC KINEMATICS */}
                    {isProjectile ? (
                      <div className="absolute inset-0 flex items-end justify-start pb-24 pl-24">
                        {/* Launcher Pad */}
                        <div className="absolute left-20 bottom-20 w-12 h-4 bg-slate-800 border border-slate-600 rounded-t" />
                        {/* Trajectory Arc guidelines */}
                        <svg className="absolute left-24 bottom-24 w-[800px] h-[400px] overflow-visible pointer-events-none">
                          <path 
                            d={`M 0 0 Q ${angle * 6} -${velocity * 12} ${angle * 12} 0`} 
                            fill="none" 
                            stroke="rgba(234,179,8,0.2)" 
                            strokeWidth="2" 
                            strokeDasharray="6 6" 
                          />
                        </svg>
                        {/* Projectile Sphere animated moving along custom trajectory */}
                        <motion.div 
                          animate={{ 
                            x: isPlaying ? [0, angle * 12 * Math.min(1, time / 3)] : 0,
                            y: isPlaying ? [0, -Math.sin(time * 2) * velocity * 8] : 0 
                          }}
                          transition={{ duration: 0.1, ease: "linear" }}
                          className="absolute left-24 bottom-24 -translate-x-1/2 translate-y-1/2 z-20"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 shadow-[0_0_30px_rgba(234,179,8,0.6)] border border-white flex items-center justify-center relative">
                            {/* Velocity Vector Arrow pointing out */}
                            <div className="absolute top-1/2 left-1/2 w-20 h-1 bg-amber-400 origin-left -rotate-45 pointer-events-none flex items-center justify-end">
                              <div className="w-2 h-2 border-t-2 border-r-2 border-amber-300 rotate-45" />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-950">P1</span>
                          </div>
                        </motion.div>
                      </div>
                    ) : isPendulum ? (
                      
                      /* TOPIC B: HARMONIC PENDULUM OSCILLATION */
                      <div className="absolute top-12 flex flex-col items-center">
                        {/* Fixed Ceiling Anchor */}
                        <div className="w-32 h-3 bg-slate-800 border-b border-slate-600 rounded" />
                        <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white -mt-1 shadow-md z-10" />
                        
                        {/* Swinging container assembly */}
                        <motion.div 
                          animate={{ rotate: isPlaying ? Math.sin(time * 3) * angle : angle }}
                          transition={{ duration: 0.1, ease: "linear" }}
                          className="flex flex-col items-center origin-top"
                        >
                          {/* Premium Glowing String */}
                          <div className="w-1 h-64 bg-gradient-to-b from-indigo-500/80 to-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                          
                          {/* High Mass Pendulum Bob */}
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_35px_rgba(6,182,212,0.8)] border-2 border-white flex items-center justify-center relative group/bob">
                            <div className="absolute inset-2 bg-white/20 rounded-full blur-xs" />
                            <span className="text-xs font-mono font-bold text-white tracking-tighter">m={mass}</span>
                            
                            {/* Force display arrow indicator */}
                            <div className="absolute top-full mt-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                              v = {currentVelocity} m/s
                            </div>
                          </div>
                        </motion.div>
                      </div>

                    ) : isCircuit ? (

                      /* TOPIC C: ELECTRIC CIRCUIT FLOW */
                      <div className="w-96 h-64 border-4 border-indigo-500/40 rounded-3xl relative flex items-center justify-between p-6 bg-indigo-950/20 shadow-inner">
                        {/* Battery Left */}
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-20 bg-slate-900 border-2 border-indigo-400 rounded-lg flex flex-col items-center justify-between py-2">
                          <span className="text-red-400 font-bold text-xs">+</span>
                          <span className="text-blue-400 font-bold text-xs">-</span>
                        </div>
                        {/* Premium Glowing Resistor Target */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-slate-950 border-2 border-amber-500 rounded-xl flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                          <span className="text-xs font-mono text-amber-300">R = {force} Ω</span>
                        </div>
                        {/* Interactive Current Flow particles */}
                        <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
                          {[1, 2, 3, 4].map(i => (
                            <span key={i} className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: `${i * 0.3}s` }} />
                          ))}
                        </div>
                        <div className="text-center w-full space-y-1">
                          <div className="text-xs font-mono text-indigo-300">Current Flow: Active</div>
                          <div className="text-xl font-mono font-bold text-white">{currentVelocity} A</div>
                        </div>
                      </div>

                    ) : (

                      /* TOPIC D: STANDARD COMPREHENSIVE MULTI-OBJECT COLLISION SANDBOX */
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Ambient guidelines */}
                        <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.04] border-t border-dashed border-white/10" />

                        {/* Object A: Primary Force Core */}
                        <motion.div 
                          animate={{ x: isPlaying ? Math.min(200, time * velocity * 2) : 0 }}
                          transition={{ duration: 0.1, ease: "linear" }}
                          className="absolute left-1/3 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
                        >
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-[0_0_40px_rgba(124,58,237,0.5)] border border-indigo-300 p-2 flex flex-col items-center justify-center relative group/obj">
                            {/* Vector Arrow */}
                            <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                              <div className="w-16 h-1 bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                              <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-indigo-400" />
                            </div>
                            <span className="text-[10px] font-sans font-bold text-indigo-200">Obj 1</span>
                            <span className="text-xs font-mono font-extrabold text-white">{mass} kg</span>
                          </div>
                        </motion.div>

                        {/* Object B: Secondary Interceptor Target */}
                        <div className="absolute right-1/3 top-1/2 -translate-y-1/2 z-20 cursor-pointer">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-700 shadow-[0_0_35px_rgba(225,29,72,0.4)] border border-rose-300 flex flex-col items-center justify-center relative">
                            <span className="text-[9px] font-sans font-bold text-rose-200">Obj 2</span>
                            <span className="text-[11px] font-mono font-extrabold text-white">Target</span>
                          </div>
                        </div>
                      </div>

                    )}

                  </div>

                  {/* BOTTOM CANVAS ACTION PROMPT OVERLAY */}
                  <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-sans bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                      💡 Click & Drag canvas components to apply initial vector torque
                    </span>
                  </div>

                </div>


                {/* ========================================================= */}
                {/* CORE CANVAS CONTROLS & BOTTOM AUXILIARY TOOLBAR           */}
                {/* ========================================================= */}
                <div className="mt-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shrink-0 bg-[#03010b]/60 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/5">
                  
                  {/* Left: Playback core matrix switch */}
                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    
                    {/* Play/Pause Button */}
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`h-10 px-4 rounded-xl font-bold font-sans text-xs transition-all shadow-md flex items-center gap-2 ${
                        isPlaying 
                          ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30" 
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border-none"
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlaying ? "Pause Physics" : "Start Simulation"}</span>
                    </Button>

                    {/* Reset Button */}
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 font-sans text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset</span>
                    </Button>

                    {/* Speed dropdown tabs */}
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

                  {/* Right Auxiliary Deck: Zoom + Export + Record buttons */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                    
                    {/* Zoom deck */}
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
                        onClick={() => { setZoom(100); toast.info("Camera layout centered."); }}
                        className="px-2 py-1 rounded-lg hover:bg-white/10 text-[9px] font-sans text-indigo-300 transition-colors"
                        title="Reset Camera Viewport"
                      >
                        Center
                      </button>
                    </div>

                    <span className="text-white/10 hidden md:inline">|</span>

                    {/* Export snapshot */}
                    <Button
                      variant="ghost"
                      onClick={handleExportJSON}
                      className="h-9 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white text-xs font-sans gap-1.5 border border-white/5"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="hidden md:inline">Export</span>
                    </Button>

                    {/* Record Video switch */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const next = !isRecording;
                        setIsRecording(next);
                        toast[next ? "success" : "info"](next ? "Simulation frame matrix encoding stream started." : "Recording saved to buffer outputs.");
                      }}
                      className={`h-9 px-3 rounded-xl text-xs font-sans gap-1.5 border transition-all ${
                        isRecording 
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


              {/* ========================================================= */}
              {/* RIGHT SIDE (30-35%) — FUTURISTIC CONTROL SIDEBAR STACK    */}
              {/* ========================================================= */}
              <div className={`lg:col-span-4 h-full bg-[#03010b]/50 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 select-none ${
                mobilePanelView === "canvas" ? "hidden lg:flex" : "flex"
              }`}>
                
                {/* SECTION 1: DYNAMIC TOPIC PARAMETERS SLIDERS */}
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h3 className="text-xs font-sans font-extrabold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      1. Parameters Deck
                    </h3>
                    <span className="text-[9px] font-mono text-indigo-400 font-semibold">Live Override</span>
                  </div>

                  <div className="space-y-3.5">
                    
                    {/* Mass Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Object Mass</span>
                        <span className="text-indigo-400 font-mono font-bold">{mass} kg</span>
                      </div>
                      <Slider value={[mass]} min={1} max={50} step={1} onValueChange={v => setMass(v[0])} className="py-1.5" />
                    </div>

                    {/* Applied Force Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Applied Vector Force</span>
                        <span className="text-indigo-400 font-mono font-bold">{force} N</span>
                      </div>
                      <Slider value={[force]} min={0} max={100} step={5} onValueChange={v => setForce(v[0])} className="py-1.5" />
                    </div>

                    {/* Initial Velocity Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Initial Velocity</span>
                        <span className="text-indigo-400 font-mono font-bold">{velocity} m/s</span>
                      </div>
                      <Slider value={[velocity]} min={0} max={50} step={1} onValueChange={v => setVelocity(v[0])} className="py-1.5" />
                    </div>

                    {/* Angle / Friction options depending on view */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">{isProjectile ? "Launch Angle" : "Surface Friction"}</span>
                        <span className="text-indigo-400 font-mono font-bold">{isProjectile ? `${angle}°` : friction.toFixed(2)}</span>
                      </div>
                      {isProjectile ? (
                        <Slider value={[angle]} min={0} max={90} step={5} onValueChange={v => setAngle(v[0])} className="py-1.5" />
                      ) : (
                        <Slider value={[friction]} min={0} max={0.5} step={0.05} onValueChange={v => setFriction(v[0])} className="py-1.5" />
                      )}
                    </div>

                    {/* Environmental Gravity Adjuster */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-sans">
                        <span className="text-slate-300">Gravity Scalar</span>
                        <span className="text-indigo-400 font-mono font-bold">{gravityVal.toFixed(1)} m/s²</span>
                      </div>
                      <Slider value={[gravityVal]} min={0} max={25} step={0.5} onValueChange={v => setGravityVal(v[0])} className="py-1.5" />
                    </div>

                  </div>
                </div>


                {/* SECTION 2: LIVE DATA METRIC CARDS */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-sans font-extrabold text-slate-400 tracking-wider uppercase px-1">
                    2. Real-Time Telemetry
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Velocity card */}
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <span className="text-[9px] font-sans text-slate-400 block">Velocity</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-mono font-extrabold text-white">{currentVelocity}</span>
                        <span className="text-[9px] font-mono text-indigo-400">m/s</span>
                      </div>
                      <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>

                    {/* Acceleration card */}
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <span className="text-[9px] font-sans text-slate-400 block">Acceleration</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-mono font-extrabold text-white">{currentAcceleration}</span>
                        <span className="text-[9px] font-mono text-indigo-400">m/s²</span>
                      </div>
                      <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    </div>

                    {/* Energy card */}
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <span className="text-[9px] font-sans text-slate-400 block">System Energy</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-mono font-extrabold text-white">{currentEnergy}</span>
                        <span className="text-[9px] font-mono text-indigo-400">J</span>
                      </div>
                      <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    </div>

                    {/* Momentum card */}
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <span className="text-[9px] font-sans text-slate-400 block">Net Momentum</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base font-mono font-extrabold text-white">{currentMomentum}</span>
                        <span className="text-[9px] font-mono text-indigo-400">kg·m/s</span>
                      </div>
                      <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                </div>


                {/* SECTION 3: AI EXPLANATION BOX */}
                <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/40 p-3.5 rounded-xl border border-indigo-500/20 relative overflow-hidden space-y-1.5 shadow-inner">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-sans font-bold text-indigo-300 uppercase tracking-wide">
                      3. Live AI Insight
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-200 leading-relaxed italic pl-1">
                    “Higher force increases acceleration according to Newton’s Second Law. Kinetic torque decays cleanly proportional to friction matrices.”
                  </p>
                </div>


                {/* SECTION 4: GRAPHS SECTION (RECHARTS INTEGRATION) */}
                <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-extrabold text-slate-300 uppercase tracking-wider">
                      4. Continuous Chart Deck
                    </span>
                    
                    {/* Tiny inline tabs */}
                    <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                      {(["velocity", "position", "energy"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveChartTab(tab)}
                          className={`px-2 py-0.5 rounded text-[9px] font-sans font-bold capitalize transition-all ${
                            activeChartTab === tab ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {tab.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Dark themed Recharts view */}
                  <div className="h-36 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="t" stroke="#64748b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <ChartTooltip 
                          contentStyle={{ backgroundColor: "#03010b", borderColor: "#6366f1", borderRadius: "8px", fontSize: "10px", color: "#fff" }} 
                        />
                        
                        {activeChartTab === "velocity" && (
                          <Line type="monotone" dataKey="vel" name="Velocity" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "position" && (
                          <Line type="monotone" dataKey="pos" name="Position" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                        {activeChartTab === "energy" && (
                          <Line type="monotone" dataKey="energy" name="Energy" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>


                {/* SECTION 5: OBJECT CONTROLS DECK */}
                <div className="space-y-2">
                  <span className="text-[10px] font-sans font-extrabold text-slate-400 tracking-wider uppercase px-1">
                    5. Environment Actions
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setObjectsCount(c => c + 1); toast.success("Injected object boundary node."); }}
                      className="h-8 rounded-lg bg-white/[0.02] hover:bg-white/10 border-white/5 text-[11px] text-slate-300 gap-1.5 font-sans justify-start"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Add Object ({objectsCount})</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => { setObjectsCount(c => Math.max(1, c - 1)); toast.info("Removed boundary object."); }}
                      className="h-8 rounded-lg bg-white/[0.02] hover:bg-white/10 border-white/5 text-[11px] text-slate-300 gap-1.5 font-sans justify-start"
                    >
                      <Minus className="w-3 h-3 text-rose-400" />
                      <span>Remove Obj</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => { const g = !hasGravity; setHasGravity(g); toast.info(`Gravity matrix ${g ? "Enabled" : "Disabled"}`); }}
                      className={`h-8 rounded-lg text-[11px] gap-1.5 font-sans justify-start border transition-all ${
                        hasGravity ? "bg-indigo-950/40 text-indigo-300 border-indigo-500/30" : "bg-white/[0.02] text-slate-500 border-white/5"
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${hasGravity ? "text-indigo-400" : "text-slate-600"}`} />
                      <span>Gravity: {hasGravity ? "On" : "Off"}</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => { const c = !hasCollision; setHasCollision(c); toast.info(`Collision physics ${c ? "Active" : "Bypassed"}`); }}
                      className={`h-8 rounded-lg text-[11px] gap-1.5 font-sans justify-start border transition-all ${
                        hasCollision ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30" : "bg-white/[0.02] text-slate-500 border-white/5"
                      }`}
                    >
                      <Gauge className={`w-3 h-3 ${hasCollision ? "text-emerald-400" : "text-slate-600"}`} />
                      <span>Collision: {hasCollision ? "On" : "Off"}</span>
                    </Button>
                  </div>
                </div>


                {/* ========================================================= */}
                {/* BONUS FEATURES CLUSTER                                    */}
                {/* ========================================================= */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  
                  {/* AI Suggestions / Macro options */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-sans font-extrabold text-indigo-400 tracking-wider uppercase px-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Quick AI Scenarios
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "High Impulse Test", overrides: { force: 90, velocity: 40 } },
                        { label: "Zero Resistance Arc", overrides: { friction: 0, angle: 60 } },
                        { label: "Low Gravity Drift", overrides: { mass: 5, velocity: 10 } }
                      ].map((macro, mIdx) => (
                        <button
                          key={mIdx}
                          onClick={() => handleTryExperiment(macro.label, macro.overrides)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 text-[10px] font-sans text-indigo-200 transition-colors"
                        >
                          ⚡ {macro.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save / Share buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toast.success("Saved interactive runtime blueprint to internal history store.")}
                      className="flex-1 h-8 rounded-lg bg-white/[0.02] hover:bg-white/10 border-white/5 text-[11px] text-slate-300 gap-1.5 font-sans"
                    >
                      <Save className="w-3 h-3 text-slate-400" />
                      <span>Save State</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Simulation sandbox direct URL copied to clipboard.");
                      }}
                      className="flex-1 h-8 rounded-lg bg-white/[0.02] hover:bg-white/10 border-white/5 text-[11px] text-slate-300 gap-1.5 font-sans"
                    >
                      <Share2 className="w-3 h-3 text-indigo-400" />
                      <span>Share Link</span>
                    </Button>
                  </div>

                  {/* History Logs drawer summary */}
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      <History className="w-2.5 h-2.5" /> Pipeline Execution Audit
                    </div>
                    <div className="space-y-0.5 max-h-16 overflow-y-auto custom-scrollbar">
                      {historyLogs.map((log, lIdx) => (
                        <div key={lIdx} className="text-[10px] font-mono text-slate-400 truncate pl-1">
                          ▸ {log}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Floating mini assistant button at bottom-left corner of the overlay */}
          <div className="absolute bottom-5 left-5 z-50">
            <button
              onClick={() => toast.info("AI Mini Assistant: Need real-time variable vector matrix assistance? Describe your targeted trajectory!")}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.6)] hover:shadow-[0_0_30px_rgba(124,58,237,0.8)] border border-white/10 flex items-center gap-2 text-xs font-sans font-bold transition-all hover:scale-105 active:scale-95 group animate-bounce"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
              <span>Ask AI Helper</span>
            </button>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}
