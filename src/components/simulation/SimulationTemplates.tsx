import React from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Activity, Thermometer, FlaskConical, FunctionSquare as Function } from "lucide-react";
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
