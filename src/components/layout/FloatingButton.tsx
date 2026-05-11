import React, { useState } from "react";
import { Sparkles, Wand2, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useRouterState } from "@tanstack/react-router";
import { SimulationPromptPanel } from "@/components/simulation/SimulationPromptPanel";
import { toast } from "sonner";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { useSavedSimulations } from "@/hooks/useSavedSimulations";
import { useEffect } from "react";


export function FloatingButton() {
  const { 
    tutorResponse, 
    isGeneratingSimulation, 
    setSimulationModalOpen,
    isSimulationModalOpen,
    savedSimulations,
    setGeneratingSimulation
  } = useSimulationStore();
  
  const routerState = useRouterState();
  const isTutorPage = routerState.location.pathname === "/tutor";

  const { generateStream, loading, simulation, error } = useAgentSimulation();
  const { saveSimulation } = useSavedSimulations();

  const handleGenerate = async (prompt: string) => {
    toast.info("Initializing AI simulation agent...");
    await generateStream(prompt);
  };

  useEffect(() => {
    if (simulation) {
      saveSimulation({
        id: simulation.id,
        title: simulation.title,
        subject: simulation.topic?.subject || "Physics",
        type: "dsl",
        simulation: simulation.dsl,
      });
      toast.success("Simulation generated and saved to library!");
      setSimulationModalOpen(false);
    }
  }, [simulation, saveSimulation, setSimulationModalOpen]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const shouldShow = !loading;
  const hasNoSims = savedSimulations.length === 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <Dialog open={isSimulationModalOpen} onOpenChange={setSimulationModalOpen}>
          <DialogTrigger asChild>
            <motion.button
              initial={{ opacity: 0, y: 100, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                y: [0, -8, 0], 
                scale: 1,
                boxShadow: [
                  "0 0 20px var(--shadow-glow)",
                  "0 0 35px var(--shadow-glow)",
                  "0 0 20px var(--shadow-glow)"
                ]
              }}
              transition={{
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                boxShadow: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 }
              }}
              exit={{ opacity: 0, y: 100, scale: 0.5 }}
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 50px var(--shadow-glow)",
              }}
              whileTap={{ scale: 0.95 }}
              className="fixed bottom-8 right-8 z-50 px-8 py-4 rounded-full bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white font-bold shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-3 transition-all group overflow-hidden"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-white" />
              <span className="hidden md:inline text-lg tracking-tight">Generate Simulation</span>
              <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity -z-10" />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-background border border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl backdrop-blur-xl">
             <SimulationPromptPanel 
               onGenerate={handleGenerate} 
               isLoading={loading} 
             />
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
