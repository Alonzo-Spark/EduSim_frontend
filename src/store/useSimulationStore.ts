import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      
      savedSimulations: [],
      favorites: [],
      recentSimulations: [],
      
      setTopic: (topic) => set({ currentTopic: topic }),
      setTutorResponse: (response) => set({ tutorResponse: response }),
      setLoadingTutor: (loading) => set({ isLoadingTutor: loading }),
      setSimulationPrompt: (prompt) => set({ simulationPrompt: prompt }),
      setGeneratingSimulation: (generating) => set({ isGeneratingSimulation: generating }),
      setSimulationModalOpen: (open) => set({ isSimulationModalOpen: open }),
      setActiveSimulation: (sim) => set({ activeSimulation: sim }),
      
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
