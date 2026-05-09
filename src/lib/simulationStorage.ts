import { SavedSimulation } from "@/types/saved-simulation";

const STORAGE_KEY = "edusim_saved_simulations";

export const simulationStorage = {
  /** Load all saved simulations from localStorage */
  load(): SavedSimulation[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load simulations from localStorage:", error);
      return [];
    }
  },

  /** Save all simulations to localStorage */
  save(simulations: SavedSimulation[]): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
    } catch (error) {
      console.error("Failed to save simulations to localStorage:", error);
    }
  },

  /** Add or update a single simulation */
  upsert(simulation: SavedSimulation): void {
    const all = this.load();
    const filtered = all.filter((s) => s.id !== simulation.id);
    this.save([simulation, ...filtered]);
  },

  /** Delete a simulation by ID */
  delete(id: string): void {
    const all = this.load();
    const filtered = all.filter((s) => s.id !== id);
    this.save(filtered);
  }
};
