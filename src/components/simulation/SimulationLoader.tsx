import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Cpu, Zap, Activity, Box } from 'lucide-react';

const STAGES = [
  "Understanding Prompt",
  "Retrieving Knowledge",
  "Generating Physics Model",
  "Building Simulation",
  "Rendering Scene",
];

interface SimulationLoaderProps {
  title?: string;
  stage?: string;
  progress?: number;
}

export const SimulationLoader = ({
  title = "Synthesizing AI Simulation",
  stage,
  progress,
}: SimulationLoaderProps) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (stage) {
      const exactIndex = STAGES.findIndex((item) => item === stage);
      if (exactIndex >= 0) {
        setStageIndex(exactIndex);
        return;
      }
      const partialIndex = STAGES.findIndex((item) => item.toLowerCase().includes(stage.toLowerCase()) || stage.toLowerCase().includes(item.toLowerCase()));
      if (partialIndex >= 0) {
        setStageIndex(partialIndex);
        return;
      }
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [stage]);

  const normalizedProgress = typeof progress === 'number'
    ? Math.max(8, Math.min(100, progress))
    : Math.min(100, Math.max(8, ((stageIndex + 1) / STAGES.length) * 100));

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#050314]/60 backdrop-blur-3xl rounded-[2rem] overflow-hidden relative border border-white/5">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px] animate-pulse delay-700" />

      {/* Main Spinner Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-500/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-24 h-24 rounded-full border-2 border-indigo-500/10 scale-110"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)]"
            >
              <Brain className="w-8 h-8 text-white fill-white/10" />
            </motion.div>
          </div>

          {/* Orbiting particles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />
          </motion.div>
        </div>

        {/* Textual Feedback */}
        <div className="text-center space-y-3">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            {title}
          </h3>
          
          <div className="h-6 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={stageIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xs font-mono text-indigo-300/80 uppercase tracking-[0.2em]"
              >
                {STAGES[stageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-white/5 rounded-full mt-6 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${normalizedProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span>{Math.round(normalizedProgress)}%</span>
            <span>•</span>
            <span>{stage || STAGES[stageIndex]}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-md mx-auto">
            {STAGES.map((item, index) => {
              const active = index <= stageIndex;
              return (
                <span
                  key={item}
                  className={`px-3 py-1 rounded-full border text-[10px] tracking-[0.2em] uppercase ${active ? "border-cyan-400/30 text-cyan-100 bg-cyan-400/10" : "border-white/10 text-white/30 bg-white/5"}`}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side Icons */}
      <div className="absolute bottom-8 left-8 flex items-center gap-4 text-white/10">
        <Cpu className="w-5 h-5" />
        <Zap className="w-5 h-5" />
        <Activity className="w-5 h-5" />
        <Box className="w-5 h-5" />
      </div>
    </div>
  );
};
