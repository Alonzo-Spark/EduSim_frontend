import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Wand2, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSimulationStore } from "@/store/useSimulationStore";

import { SimulationPromptPanel } from "@/components/simulation/SimulationPromptPanel";
import { toast } from "sonner";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { useSavedSimulations } from "@/hooks/useSavedSimulations";
import { FloatingSimulationWorkspaceOverlay } from "@/components/simulation/FloatingSimulationWorkspaceOverlay";
import { Link, useRouterState } from "@tanstack/react-router";

export function FloatingButton() {
  const { 
    tutorResponse, 
    isGeneratingSimulation, 
    setSimulationModalOpen,
    isSimulationModalOpen,
    savedSimulations,
    setGeneratingSimulation
  } = useSimulationStore();

  useEffect(() => {
    import("@/services/agentSimulationService").then(({ agentSimulationService }) => {
      agentSimulationService.ping().then(status => {
        if (status.success) {
          console.log("✅ EduSim_API Connection Verified:", status.message);
        } else {
          console.error("❌ EduSim_API Connection Failed:", status.message);
        }
      });
    });
  }, []);
  
  const routerState = useRouterState();
  const isTutorPage = routerState.location.pathname === "/tutor";

  const { generateStream, loading, simulation, error, progress, progressPercentage } = useAgentSimulation();
  const { saveSimulation } = useSavedSimulations();

  const [isWorkspaceOverlayOpen, setIsWorkspaceOverlayOpen] = useState(false);
  const [overlaySimData, setOverlaySimData] = useState<any>(null);
  const [currentPromptState, setCurrentPromptState] = useState<string>("");

  const handleGenerate = async (prompt: string) => {
    toast.info("Initializing AI simulation agent...");
    setSimulationModalOpen(false);
    setCurrentPromptState(prompt);
    
    // Open overlay immediately with initial context state to guarantee UX flow continuity
    setOverlaySimData({
      title: prompt.split(".")[0] || "Synthesizing AI Scenario",
      isGeneratingStream: true,
      prompt,
      loading: true,
      error: null,
      progressPercentage: 5,
      progressStage: "Initializing AI simulation agent...",
      onRetry: () => handleGenerate(prompt)
    });
    setIsWorkspaceOverlayOpen(true);
    
    console.log("Starting simulation generation");
    try {
      await generateStream(prompt);
      console.log("AI response received");
      console.log("DSL generated");
      console.log("Loading complete");
    } catch (err: any) {
      console.error("Generation failed:", err);
      // Ensure local loading state in overlaySimData is cleared so UI recovers cleanly
      setOverlaySimData((prev: any) => ({
        ...prev,
        loading: false,
        error: err?.message || "Connection timeout during AI pipeline execution.",
      }));
    } finally {
      // Guarantee loading overlay unblocks regardless of Promise status
      setOverlaySimData((prev: any) => prev ? ({ ...prev, loading: false }) : null);
    }
  };

  // Synchronize dynamic updates during live SSE synthesis frames
  useEffect(() => {
    if (isWorkspaceOverlayOpen) {
      setOverlaySimData((prev: any) => ({
        ...prev,
        ...simulation,
        dsl: simulation?.dsl || prev?.dsl,
        title: simulation?.title || prev?.title || "Dynamic Physics Laboratory",
        loading,
        error: error || prev?.error || null,
        progressPercentage: progressPercentage || prev?.progressPercentage || 10,
        progressStage: progress?.stage || prev?.progressStage || "Synthesizing scenario parameters...",
        prompt: currentPromptState || prev?.prompt,
        onRetry: () => handleGenerate(currentPromptState || prev?.prompt || "")
      }));
    }
  }, [simulation, loading, error, progressPercentage, progress, isWorkspaceOverlayOpen, currentPromptState]);

  const hasSavedSimRef = useRef<string | null>(null);
  useEffect(() => {
    if (simulation && simulation.dsl && !loading) {
      const targetId = simulation.id || simulation.title;
      if (hasSavedSimRef.current !== targetId) {
        hasSavedSimRef.current = targetId;
        saveSimulation({
          id: simulation.id,
          title: simulation.title,
          subject: simulation.topic?.subject || "Physics",
          type: "dsl",
          simulation: simulation.dsl,
        });
        toast.success("Simulation generated and saved to library!");
      }
    }
  }, [simulation, loading, saveSimulation]);

  const shouldShow = !loading;
  const hasNoSims = savedSimulations.length === 0;
  const showTutorGenerator = !isTutorPage;

  return (
    <>
      <AnimatePresence>
        {showTutorGenerator && shouldShow && (
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

      {/* Embedded completely decoupled high-fidelity PhET + Figma workspace overlay modal */}
      <FloatingSimulationWorkspaceOverlay 
        isOpen={isWorkspaceOverlayOpen}
        onClose={() => setIsWorkspaceOverlayOpen(false)}
        simulation={overlaySimData}
      />
    </>
  );
}
