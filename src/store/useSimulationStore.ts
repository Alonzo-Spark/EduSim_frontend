import { create } from "zustand";

interface SimulationStore {
  // Tutor State
  currentTopic: string | null;
  tutorResponse: any | null;
  isLoadingTutor: boolean;
  
  // Actions
  setTopic: (topic: string) => void;
  setTutorResponse: (response: any) => void;
  setLoadingTutor: (loading: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  currentTopic: null,
  tutorResponse: null,
  isLoadingTutor: false,
  
  setTopic: (topic) => set({ currentTopic: topic }),
  setTutorResponse: (response) => set({ tutorResponse: response }),
  setLoadingTutor: (loading) => set({ isLoadingTutor: loading }),
}));
