import React, { useEffect, useRef, useState } from "react";
import { PhysicsEngine } from "@/runtime/physicsEngine";
import { SimulationDSL, SimulationSnapshot } from "@/runtime/dsl";
import { SimulationRenderer } from "@/runtime/rendering";
import { Play, Pause, RotateCcw, Settings2, HelpCircle, Layout } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { HtmlRenderer } from "./HtmlRenderer";

interface DynamicSimulationRendererProps {
  dsl?: SimulationDSL;
  html?: string;
  title?: string;
}

export const DynamicSimulationRenderer: React.FC<DynamicSimulationRendererProps> = ({ dsl, html, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isDslReady, setIsDslReady] = useState(false);

  useEffect(() => {
    if (!dsl || !canvasRef.current) {
      setIsDslReady(false);
      return;
    }

    const engine = new PhysicsEngine(dsl);
    const renderer = new SimulationRenderer(canvasRef.current);
    
    engineRef.current = engine;
    rendererRef.current = renderer;

    const unsubscribe = engine.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
      renderer.render(newSnapshot);
    });

    engine.start();
    setIsDslReady(true);

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [dsl]);

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

  const handleControlChange = (bind: string, value: number) => {
    engineRef.current?.setControl(bind, value);
  };

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col">
      {/* Simulation Title Overlay */}
      <div className="absolute top-6 left-8 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">
          {dsl.meta?.title || title || "Physics Simulation"}
        </h2>
        <div className="flex gap-2 mt-1">
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
            {dsl.meta?.topic || "General"}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
            {dsl.meta?.difficulty || "Beginner"}
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative cursor-crosshair">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full outline-none"
        />
        
        {/* Floating Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl z-20 pointer-events-auto">
          <button 
            onClick={() => snapshot?.paused ? engineRef.current?.resume() : engineRef.current?.pause()}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-950 hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            {snapshot?.paused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
          </button>
          
          <button 
            onClick={() => engineRef.current?.reset(dsl)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-white hover:bg-slate-700 transition-all border border-white/10"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button 
            onClick={() => setShowControls(!showControls)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showControls ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            <Settings2 className="w-5 h-5" />
          </button>
          
          <div className="text-slate-400 text-xs font-mono ml-2 tabular-nums">
            {snapshot?.time.toFixed(2)}s
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
                Parameters
              </h3>
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
            </div>

            <div className="space-y-8">
              {dsl.interactions?.map((interaction) => {
                const currentValue = engineRef.current?.getControl(interaction.bind) ?? interaction.value ?? 0;
                
                return (
                  <div key={interaction.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {interaction.label}
                      </label>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {typeof currentValue === "number" ? currentValue.toFixed(2) : String(currentValue)}
                        {interaction.unit}
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

            {dsl.equations && dsl.equations.length > 0 && (
              <div className="mt-12 space-y-4">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
