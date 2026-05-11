import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, Settings2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface SimulationPromptPanelProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const PRESETS = [
  "Visualize vectors and forces",
  "Add multiple colliding objects",
  "Change environmental gravity",
  "Show real-time data plots"
];

export function SimulationPromptPanel({ onGenerate, isLoading }: SimulationPromptPanelProps) {
  const [prompt, setPrompt] = React.useState("");

  return (
    <div className="glass-strong rounded-3xl p-6 border border-border space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center shadow-lg glow-purple">
          <Settings2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Refine Simulation</h3>
          <p className="text-xs text-muted-foreground">Adjust parameters and interaction modes.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Textarea 
            placeholder="Describe specific behaviors or interactions..."
            className="min-h-[100px] bg-secondary border border-border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/30 transition-all resize-none text-foreground"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="absolute bottom-3 right-3">
             <Brain className="w-4 h-4 text-muted-foreground/30" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                 <Zap className="w-3 h-3" /> Complexity
              </label>
              <Select defaultValue="balanced">
                 <SelectTrigger className="bg-secondary border border-border rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Level" />
                 </SelectTrigger>
                 <SelectContent className="bg-background border-border text-foreground">
                    <SelectItem value="simple">Basic Concepts</SelectItem>
                    <SelectItem value="balanced">Standard Lab</SelectItem>
                    <SelectItem value="advanced">Advanced Physics</SelectItem>
                 </SelectContent>
              </Select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                 <HelpCircle className="w-3 h-3" /> Interaction
              </label>
              <Select defaultValue="sandbox">
                 <SelectTrigger className="bg-secondary border border-border rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Mode" />
                 </SelectTrigger>
                 <SelectContent className="bg-background border-border text-foreground">
                    <SelectItem value="guided">Guided Study</SelectItem>
                    <SelectItem value="sandbox">Free Sandbox</SelectItem>
                    <SelectItem value="quiz">Challenge Mode</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </div>

        <div className="space-y-3">
           <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
               {PRESETS.map(p => (
                 <button 
                   key={p}
                   onClick={() => setPrompt(p)}
                   className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all font-medium"
                 >
                    {p}
                 </button>
               ))}
            </div>
        </div>
      </div>

      <Button 
        onClick={() => onGenerate(prompt)}
        disabled={isLoading || !prompt.trim()}
        className="w-full py-6 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-bold shadow-lg glow-purple hover:scale-[1.02] transition-all active:scale-95 border-none"
      >
        {isLoading ? "Analyzing..." : "Generate Custom Lab"}
        <Sparkles className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
