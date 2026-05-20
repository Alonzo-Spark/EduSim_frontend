import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RuntimeState } from "@/runtime/schema/runtimeSchema";

interface Simulation {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  favorite: boolean;
  type: "dsl" | "html";
  simulation: string | any;
}

interface SimulationStore {
  // Tutor State
  currentTopic: string | null;
  tutorResponse: any | null;
  isLoadingTutor: boolean;
  
  // Simulation State
  simulationPrompt: string;
  isGeneratingSimulation: boolean;
  isSimulationModalOpen: boolean;
  activeSimulation: Simulation | null;

  // End-to-End Dynamic Workflow State
  generatingSimulation: boolean;
  simulationGenerated: boolean;
  activeTopic: string | null;
  simulationData: any | null;
  rendererType: "physics" | "graph" | "diagram" | "hybrid";
  aiExplanation: string;
  concepts: string[];
  formulas: any[];
  graphs: any[];
  controls: any[];
  sceneConfig: any;
  runtimeConfig: any;
  error: string | null;

  // Unified Runtime Pipeline State
  runtimeState: RuntimeState;
  generationPhase: string;
  generationProgress: number;
  
  // Library State
  savedSimulations: Simulation[];
  favorites: string[]; // IDs
  recentSimulations: string[]; // IDs
  
  // Actions
  setTopic: (topic: string) => void;
  setTutorResponse: (response: any) => void;
  setLoadingTutor: (loading: boolean) => void;
  setSimulationPrompt: (prompt: string) => void;
  setGeneratingSimulation: (generating: boolean) => void;
  setSimulationModalOpen: (open: boolean) => void;
  setActiveSimulation: (sim: Simulation | null) => void;

  // Workflow sync actions
  setSimulationGenerated: (generated: boolean) => void;
  setActiveTopic: (topic: string | null) => void;
  setSimulationWorkspaceData: (data: {
    simulationData: any;
    rendererType?: "physics" | "graph" | "diagram" | "hybrid";
    aiExplanation: string;
    concepts: string[];
    formulas: any[];
    graphs?: any[];
    controls: any[];
    sceneConfig: any;
    runtimeConfig?: any;
  }) => void;
  setError: (error: string | null) => void;
  setRuntimeState: (state: RuntimeState, phase?: string) => void;
  setGenerationProgress: (progress: number) => void;
  resetGenerationState: () => void;
  
  saveSimulation: (sim: Simulation) => void;
  deleteSimulation: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToRecent: (id: string) => void;
}

export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set) => ({
      currentTopic: null,
      tutorResponse: null,
      isLoadingTutor: false,
      
      simulationPrompt: "",
      isGeneratingSimulation: false,
      isSimulationModalOpen: false,
      activeSimulation: null,

      generatingSimulation: false,
      simulationGenerated: false,
      activeTopic: null,
      simulationData: null,
      rendererType: "physics",
      aiExplanation: "",
      concepts: [],
      formulas: [],
      graphs: [],
      controls: [],
      sceneConfig: null,
      runtimeConfig: null,
      error: null,

      runtimeState: RuntimeState.IDLE,
      generationPhase: "",
      generationProgress: 0,
      
      savedSimulations: [],
      favorites: [],
      recentSimulations: [],
      
      setTopic: (topic) => set({ currentTopic: topic }),
      setTutorResponse: (response) => set({ tutorResponse: response }),
      setLoadingTutor: (loading) => set({ isLoadingTutor: loading }),
      setSimulationPrompt: (prompt) => set({ simulationPrompt: prompt }),
      setGeneratingSimulation: (generating) => set({ isGeneratingSimulation: generating, generatingSimulation: generating }),
      setSimulationModalOpen: (open) => set({ isSimulationModalOpen: open }),
      setActiveSimulation: (sim) => set({ activeSimulation: sim }),

      setSimulationGenerated: (generated) => set({ simulationGenerated: generated }),
      setActiveTopic: (topic) => set({ activeTopic: topic }),
      setSimulationWorkspaceData: (data) => set({
        simulationData: data.simulationData,
        rendererType: data.rendererType || "physics",
        aiExplanation: data.aiExplanation,
        concepts: data.concepts,
        formulas: data.formulas,
        graphs: data.graphs || [],
        controls: data.controls,
        sceneConfig: data.sceneConfig,
        runtimeConfig: data.runtimeConfig || null,
        simulationGenerated: true,
        runtimeState: RuntimeState.READY,
        generationProgress: 1,
        error: null
      }),
      setError: (err) => set({ error: err, runtimeState: err ? RuntimeState.ERROR : RuntimeState.IDLE }),
      setRuntimeState: (state, phase) => set({ 
        runtimeState: state, 
        generationPhase: phase || "",
        ...(state === RuntimeState.GENERATING ? { generatingSimulation: true } : {})
      }),
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      resetGenerationState: () => set({
        generatingSimulation: false,
        isGeneratingSimulation: false,
        simulationGenerated: false,
        simulationData: null,
        rendererType: "physics",
        aiExplanation: "",
        concepts: [],
        formulas: [],
        graphs: [],
        controls: [],
        sceneConfig: null,
        runtimeConfig: null,
        runtimeState: RuntimeState.IDLE,
        generationPhase: "",
        generationProgress: 0,
        error: null
      }),
      
      saveSimulation: (sim) => set((state) => ({ 
        savedSimulations: [sim, ...state.savedSimulations] 
      })),
      deleteSimulation: (id) => set((state) => ({ 
        savedSimulations: state.savedSimulations.filter(s => s.id !== id) 
      })),
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id) 
          ? state.favorites.filter(fid => fid !== id)
          : [...state.favorites, id]
      })),
      addToRecent: (id) => set((state) => ({
        recentSimulations: [id, ...state.recentSimulations.filter(rid => rid !== id)].slice(0, 10)
      })),
    }),
    {
      name: "edusim-storage",
      partialize: (state) => ({ 
        savedSimulations: state.savedSimulations,
        favorites: state.favorites,
        recentSimulations: state.recentSimulations
      }),
    }
  )
);
