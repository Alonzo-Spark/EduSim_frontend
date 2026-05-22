import React from "react";
import { motion } from "framer-motion";
import { 
  Play, Pause, RotateCcw, Activity, Thermometer, FlaskConical, 
  FunctionSquare as Function, Brain, Zap, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateProps {
  isLoading: boolean;
}

export function PhysicsSimulationPreview({ isLoading }: TemplateProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
       {/* Vectors and Forces Mock */}
       <div className="absolute top-10 left-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
             <div className="w-8 h-1 bg-[var(--neon-cyan)] rounded-full" />
             <span className="text-[10px] text-[var(--neon-cyan)] font-mono">Force: 12.5N</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-12 h-1 bg-[var(--neon-purple)] rounded-full" />
             <span className="text-[10px] text-[var(--neon-purple)] font-mono">Velocity: 4.2m/s</span>
          </div>
       </div>
       
       <motion.div 
         animate={{ 
           x: isLoading ? 0 : [0, 100, 0],
           rotate: isLoading ? 0 : [0, 360]
         }}
         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
         className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] shadow-glow flex items-center justify-center"
       >
          <Activity className="w-8 h-8 text-white opacity-50" />
       </motion.div>
       
       <div className="mt-8 text-center">
          <p className="text-xs font-mono text-muted-foreground">Physics Engine Sandbox</p>
          <p className="text-[10px] text-muted-foreground/50 italic">Gravity: 9.81m/s² | Friction: 0.1</p>
       </div>
    </div>
  );
}

export function ChemistrySimulationPreview({ isLoading }: TemplateProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
       <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-amber-400 font-mono">Temp: 298K</span>
             <Thermometer className="w-3 h-3 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-[var(--neon-cyan)] font-mono">pH: 7.2</span>
             <FlaskConical className="w-3 h-3 text-[var(--neon-cyan)]" />
          </div>
       </div>
       
       <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-32 h-32 rounded-full bg-[var(--neon-cyan)]/20 blur-2xl"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ delay: i * 0.5, duration: 2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full bg-white/20"
                  />
                ))}
             </div>
          </div>
       </div>
       
       <p className="mt-6 text-xs font-mono text-muted-foreground">Molecular Dynamics Preview</p>
    </div>
  );
}

export function MathSimulationPreview({ isLoading }: TemplateProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
       <div className="w-full h-full absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
       
       <svg className="w-48 h-48 text-[var(--neon-purple)]" viewBox="0 0 100 100">
          <motion.path 
            d="M 10 50 Q 30 10, 50 50 T 90 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" />
       </svg>
       
       <div className="mt-4 flex items-center gap-4">
          <div className="text-[10px] font-mono text-muted-foreground">f(x) = sin(x)</div>
          <Function className="w-4 h-4 text-[var(--neon-purple)]" />
       </div>
    </div>
  );
}

export const GraphRenderer = React.memo(({ dsl }: { dsl: any }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current || !dsl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const axes = dsl.axes || { x: { min: -10, max: 10, step: 1 }, y: { min: -10, max: 10, step: 1 } };
      const curves = dsl.curves || dsl.functions || dsl.equations || [];

      ctx.clearRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const stepX = width / (axes.x.max - axes.x.min);
      const stepY = height / (axes.y.max - axes.y.min);

      for (let x = axes.x.min; x <= axes.x.max; x += axes.x.step || 1) {
        const px = (x - axes.x.min) * stepX;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }

      for (let y = axes.y.min; y <= axes.y.max; y += axes.y.step || 1) {
        const py = height - (y - axes.y.min) * stepY;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      // Draw Axes
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      
      const originX = (0 - axes.x.min) * stepX;
      const originY = height - (0 - axes.y.min) * stepY;

      ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(width, originY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, height); ctx.stroke();

      // Draw Curves with animation or static
      curves.forEach((curve: any) => {
        ctx.strokeStyle = curve.color || "#38bdf8";
        ctx.lineWidth = curve.thickness || 3;
        ctx.setLineDash(curve.style === "dashed" ? [5, 5] : []);
        ctx.beginPath();

        let first = true;
        const eqStr = Array.isArray(curve.equation) ? curve.equation[0] : (curve.equation || "");
        const eq = eqStr.toLowerCase();
        
        for (let x = axes.x.min; x <= axes.x.max; x += 0.02) {
          let y = 0;
          try {
             if (eq.includes("sin")) y = Math.sin(x);
             else if (eq.includes("cos")) y = Math.cos(x);
             else if (eq.includes("tan")) y = Math.tan(x);
             else if (eq.includes("x^2")) y = x * x;
             else if (eq.includes("x^3")) y = x * x * x;
             else if (eq.includes("sqrt")) y = Math.sqrt(x);
             else if (eq.includes("log")) y = Math.log(x);
             else if (eq.includes("exp")) y = Math.exp(x);
             else y = x;
          } catch(e) { y = 0; }

          const px = (x - axes.x.min) * stepX;
          const py = height - (y - axes.y.min) * stepY;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else if (py >= 0 && py <= height) {
            ctx.lineTo(px, py);
          } else {
            first = true;
          }
        }
        ctx.stroke();
      });
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
      }
    };

    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, [dsl]);

  return (
    <div className="w-full h-full relative bg-slate-950/80 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-6 left-6 flex flex-col gap-1">
         <h4 className="text-sm font-bold text-white uppercase tracking-widest">{dsl.meta?.title || "Mathematical Analysis"}</h4>
         <p className="text-[10px] text-slate-500 font-mono italic">{dsl.meta?.description}</p>
      </div>
      <div className="absolute bottom-6 right-6 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3 h-3" /> Coordinate Engine
        </p>
      </div>
    </div>
  );
});

export const DiagramRenderer = React.memo(({ dsl }: { dsl: any }) => {
  return (
    <div className="w-full h-full relative bg-[#020617] rounded-3xl overflow-hidden border border-white/5 flex flex-col md:flex-row">
      {/* Animated Visual Area */}
      <div className="flex-1 relative p-12 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--neon-purple-dim),transparent_70%)] opacity-20" />
        
        <div className="relative w-full max-w-lg aspect-square">
          {/* Main Entity Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full h-full relative"
          >
            {/* SVG Layer for arrows and flows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 800 600">
               {dsl.flows?.map((flow: any, idx: number) => (
                 <motion.path
                   key={idx}
                   d="M 400 300 Q 500 200, 600 300" // Simplified for demonstration
                   fill="none"
                   stroke="url(#flowGradient)"
                   strokeWidth="2"
                   strokeDasharray="10 5"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1, strokeDashoffset: [0, -30] }}
                   transition={{ pathLength: { duration: 1.5 }, strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" } }}
                 />
               ))}
               <defs>
                 <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0" />
                   <stop offset="50%" stopColor="var(--neon-cyan)" stopOpacity="1" />
                   <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0" />
                 </linearGradient>
               </defs>
            </svg>

            {/* Components Layer */}
            {dsl.components?.map((comp: any, idx: number) => (
              <motion.div
                key={comp.id}
                animate={{ 
                  y: [0, Math.random() * 15 - 7, 0],
                  scale: [1, 1.02, 1]
                }}
                transition={{ duration: 5 + idx, repeat: Infinity, ease: "easeInOut" }}
                className="absolute"
                style={{ 
                  left: comp.position?.x ? `${(comp.position.x / 800) * 100}%` : `${20 + (idx * 25) % 60}%`, 
                  top: comp.position?.y ? `${(comp.position.y / 600) * 100}%` : `${30 + (idx * 20) % 40}%` 
                }}
              >
                <div className="relative group cursor-help">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-16 h-16 md:w-24 md:h-24 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-white/10 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5"
                  >
                    <span className="text-3xl mb-1">{comp.icon || "🧬"}</span>
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter text-center px-2">
                      {comp.name}
                    </span>
                  </motion.div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-black/90 border border-white/10 p-2 rounded-xl text-[9px] text-slate-300 leading-tight shadow-2xl backdrop-blur-lg">
                      {comp.label || comp.description || "Interactive biological component"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Element Layer (Particles, Clouds, Rain) */}
            {dsl.elements?.map((el: any, idx: number) => (
               <motion.div
                 key={el.id}
                 animate={
                   el.animation === "upward" ? { y: [0, -400], opacity: [0, 1, 0] } :
                   el.animation === "rain" ? { y: [-100, 400], x: [0, 20], opacity: [0, 1, 0] } :
                   { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }
                 }
                 transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: idx * 0.5 }}
                 className="absolute text-4xl pointer-events-none"
                 style={{ 
                   left: el.position?.x ? `${(el.position.x / 800) * 100}%` : `${Math.random() * 100}%`,
                   top: el.position?.y ? `${(el.position.y / 600) * 100}%` : "50%"
                 }}
               >
                 {el.type === "water_body" ? "🌊" : el.type === "sun" ? "☀️" : el.type === "cloud" ? "☁️" : "✨"}
               </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Info Sidebar */}
      <div className="w-full md:w-80 bg-black/40 backdrop-blur-2xl border-l border-white/5 p-8 flex flex-col gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
             <Brain className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Insights</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{dsl.meta?.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed italic">
            {dsl.meta?.description || "Dynamic infographic system presenting complex scientific processes through animated layers."}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
           {dsl.steps?.map((step: any, idx: number) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 + idx * 0.1 }}
               className="relative pl-6 border-l border-white/10 py-1"
             >
               <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{step.label}</h4>
               <p className="text-[10px] text-slate-500 mt-1 leading-normal">{step.description}</p>
             </motion.div>
           ))}
        </div>

        <div className="pt-4 border-t border-white/5">
           <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase">
             <span>System: InfoGraphics v4</span>
             <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live</span>
           </div>
        </div>
      </div>
    </div>
  );
});
