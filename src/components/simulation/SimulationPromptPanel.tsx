import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SimulationPromptPanelProps {
  onGenerate: (
    prompt: string,
    options?: {
      complexity: string;
      interactionMode: string;
      selectedPresets: string[];
    }
  ) => void;
  isLoading: boolean;
}

interface SampleTopic {
  title: string;
  prompt: string;
}

const SAMPLE_TOPICS: SampleTopic[] = [
  {
    title: "Elastic Collision",
    prompt: "Create an elastic collision simulation between two cars showing conservation of momentum and kinetic energy."
  },
  {
    title: "Projectile Motion",
    prompt: "Simulate the launch of a projectile with adjustable angle and initial velocity, visualizing trajectory, peak height, and range."
  },
  {
    title: "Pendulum Swing",
    prompt: "Design a simple harmonic motion simulation of a pendulum swing, showing potential and kinetic energy exchange over time."
  },
  {
    title: "Newton’s Laws",
    prompt: "Demonstrate Newton's laws of motion with interactive blocks, friction surfaces, and applied force vectors."
  },
  {
    title: "Electric Circuits",
    prompt: "Build a basic DC electric circuit simulation with resistors, a battery, and switches, including voltmeters and ammeters."
  },
  {
    title: "Wave Interference",
    prompt: "Visualize the interference pattern of two overlapping circular wave sources, demonstrating constructive and destructive interference."
  },
  {
    title: "Magnetic Fields",
    prompt: "Show the magnetic field lines around a bar magnet or current-carrying wire using interactive compass needles and iron filings."
  },
  {
    title: "Planetary Motion",
    prompt: "Model planetary orbits around a central star using universal gravitation, demonstrating Kepler's laws and orbital velocity."
  }
];

export function SimulationPromptPanel({ onGenerate, isLoading }: SimulationPromptPanelProps) {
  const [prompt, setPrompt] = useState("");

  const handleGenerateClick = () => {
    const payload = {
      topic: prompt.split(".")[0] || "Custom Lab",
      prompt,
      complexity: "balanced",
      interactionMode: "sandbox",
      selectedPresets: []
    };
    console.log("[DEBUG: Outgoing Request Payload]", payload);

    onGenerate(prompt, {
      complexity: "balanced",
      interactionMode: "sandbox",
      selectedPresets: []
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative w-full bg-background/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle top gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--neon-purple)] via-indigo-500 to-[var(--neon-blue)] opacity-90" />
      
      {/* Subtle ambient background glow blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[var(--neon-purple)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[var(--neon-blue)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
        {/* Title & Subtitle Section */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center shadow-xl glow-purple p-0.5 shrink-0">
            <div className="w-full h-full bg-card/60 backdrop-blur-md rounded-[14px] flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-foreground">
              Refine Simulation
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Design hyper-interactive AI physics visualizations with ease.
            </p>
          </div>
        </div>

        {/* Textarea Section with glowing focus effect */}
        <div className="space-y-2">
          <div className="relative group">
            {/* Glowing focus backdrop effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] rounded-2xl blur-md opacity-20 group-focus-within:opacity-60 transition-opacity duration-500" />
            <div className="relative bg-secondary/70 backdrop-blur-xl border border-border/60 focus-within:border-primary/50 rounded-2xl overflow-hidden shadow-inner transition-all duration-300">
              <Textarea 
                placeholder="Enter your specific physics parameters, custom conditions, or target behavior..."
                className="min-h-[140px] w-full bg-transparent border-none p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none leading-relaxed"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/40">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">AI Powered</span>
              </div>
            </div>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-muted-foreground px-1 pt-0.5 font-medium select-none">
            Describe what you want to visualize or choose a sample topic below.
          </p>
        </div>

        {/* Sample Topics Section */}
        <div className="space-y-3">
          <label className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Sample Topics
          </label>
          
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map((topic) => {
              const isSelected = prompt.trim() === topic.prompt.trim();
              return (
                <motion.button
                  key={topic.title}
                  onClick={() => setPrompt(topic.prompt)}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2 relative overflow-hidden group/chip ${
                    isSelected
                      ? "bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white border-transparent shadow-md glow-purple"
                      : "bg-secondary/40 hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border/60 hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  {/* Subtle hover glow layer inside chip */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/chip:opacity-100 transition-opacity pointer-events-none" />
                  <span className="relative z-10">{topic.title}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky footer for Generate Button */}
      <div className="relative border-t border-border/40 p-6 md:px-8 md:py-5 bg-background/40 backdrop-blur-md mt-auto sticky bottom-0 z-20">
        <motion.div 
          whileHover={{ scale: prompt.trim() && !isLoading ? 1.01 : 1 }} 
          whileTap={{ scale: prompt.trim() && !isLoading ? 0.98 : 1 }}
          className="w-full"
        >
          <Button 
            onClick={handleGenerateClick}
            disabled={isLoading || !prompt.trim()}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-bold text-base shadow-lg glow-purple transition-all border-none relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="tracking-wide font-semibold text-sm">Synthesizing Simulation...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full">
                <span className="tracking-wide font-bold">Generate Simulation</span>
                <Sparkles className="w-4 h-4 ml-1 group-hover:rotate-12 transition-transform" />
              </div>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
