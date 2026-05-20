import React, { useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/useSimulationStore";
import { toast } from "sonner";
import { simulationSynthesisService } from "@/services/simulationSynthesisService";
import { RuntimeState } from "@/runtime/schema/runtimeSchema";

interface GenerateSimulationButtonProps {
  subject: string;
  class_name: string;
  chapter: string;
  topic: string;
}

export function GenerateSimulationButton({
  subject,
  class_name,
  chapter,
  topic,
}: GenerateSimulationButtonProps) {
  const { 
    generatingSimulation, 
    setGeneratingSimulation, 
    setSimulationWorkspaceData,
    setSimulationGenerated,
    setError,
    setRuntimeState,
    setGenerationProgress
  } = useSimulationStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    // Prevent duplicate requests
    if (generatingSimulation) {
      console.warn("Generation already in progress");
      return;
    }

    setGeneratingSimulation(true);
    setError(null);
    setRuntimeState(RuntimeState.GENERATING, "Starting synthesis...");
    setGenerationProgress(0);
    
    const loadingToastId = toast.loading("Synthesizing AI-powered simulation...");

    try {
      const fullPrompt = `Create an interactive physics simulation for ${subject} class ${class_name}. Chapter: ${chapter}. Topic: ${topic}.`;
      
      await simulationSynthesisService.generateStream(
        fullPrompt,
        (progress) => {
          // Progress callback
          if (progress.error) {
            setError(progress.error);
            toast.error(`Generation error: ${progress.error}`, { id: loadingToastId });
            return;
          }

          // Handle progress updates (casting because the interface in service might be partial)
          const p = progress as any;
          if (p.state) {
            setRuntimeState(p.state as RuntimeState, p.phase || p.stage);
          }
          if (p.progress !== undefined) {
            setGenerationProgress(p.progress);
          }
        },
        (response: any) => {
          // Completion callback
          const dsl = response.dsl || response;
          const metadata = response.metadata || {};
          const config = response.config || {};

          const transformedData = {
            simulationData: dsl,
            rendererType: metadata.rendererType || 
                          (metadata.runtime === "matter_js" ? "physics" : "diagram") as "physics" | "graph" | "diagram" | "hybrid",
            aiExplanation: metadata.explanation || dsl?.meta?.explanation || "",
            concepts: metadata.concepts || [],
            formulas: metadata.formulas || dsl?.formulas || [],
            graphs: config.graphs || [],
            controls: config.controls || [],
            sceneConfig: config.scene || {},
            runtimeConfig: config.runtime || {},
          };

          setSimulationWorkspaceData(transformedData);
          toast.success("✨ Simulation generated successfully!", { id: loadingToastId });
          setGeneratingSimulation(false);
        },
        topic
      );

    } catch (err: any) {
      console.error("Simulation generation error:", err);
      const errorMsg = err.message || "An error occurred during simulation synthesis.";
      setError(errorMsg);
      toast.error(`Failed: ${errorMsg}`);
      setGeneratingSimulation(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={generatingSimulation}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 border-none px-6 rounded-xl font-bold flex items-center gap-2 group transition-all active:scale-95"
    >
      {generatingSimulation ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
      )}
      <span>{generatingSimulation ? "Synthesizing..." : "Generate Simulation"}</span>
    </Button>
  );
}
