/**
 * LLM Simulation Generation Service
 * Handles communication with backend AI service
 */

import { SimulationConfig, validateSimulationConfig } from "@/types/simulation";

export interface GenerateSimulationRequest {
  prompt: string;
  educational_context?: string;
}

export interface GenerateSimulationResponse {
  success: boolean;
  simulation?: SimulationConfig;
  error?: string;
  reasoning?: string;
}

class SimulationGeneratorService {
  private apiBaseUrl: string;
  private cache = new Map<string, GenerateSimulationResponse>();
  private readonly cacheStorageKey = "edusim.simulation-generator-cache";

  constructor() {
    // Get API base URL from environment or use default
    this.apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    this.loadCacheFromStorage();
  }

  private normalizeKey(prompt: string, educationalContext?: string): string {
    return `${prompt.trim().toLowerCase()}::${(educationalContext || "").trim().toLowerCase()}`;
  }

  private loadCacheFromStorage() {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      const raw = localStorage.getItem(this.cacheStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, GenerateSimulationResponse>;
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value === "object") {
          this.cache.set(key, value);
        }
      }
    } catch {
      // Ignore storage read failures.
    }
  }

  private persistCacheToStorage() {
    if (typeof localStorage === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(Object.fromEntries(this.cache.entries()));
      localStorage.setItem(this.cacheStorageKey, serialized);
    } catch {
      // Ignore storage write failures.
    }
  }

  /**
   * Generate simulation from natural language prompt
   */
  async generateSimulation(
    prompt: string,
    educationalContext?: string,
    signal?: AbortSignal,
  ): Promise<GenerateSimulationResponse> {
    try {
      const cacheKey = this.normalizeKey(prompt, educationalContext);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log("[simulationGenerator] cache hit", { cacheKey });
        return cached;
      }

      const request: GenerateSimulationRequest = {
        prompt,
        educational_context: educationalContext,
      };

      console.log("[simulationGenerator] request start", { prompt: prompt.trim() });

      const response = await fetch(`${this.apiBaseUrl}/api/generate-simulation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || `API error: ${response.status}`,
        };
      }

      const data = await response.json();

      // Validate the returned simulation config
      if (!validateSimulationConfig(data.simulation)) {
        return {
          success: false,
          error: "Invalid simulation configuration returned from API",
          reasoning: data.reasoning,
        };
      }

      this.cache.set(cacheKey, {
        success: true,
        simulation: data.simulation,
        reasoning: data.reasoning,
      });
      this.persistCacheToStorage();
      console.log("[simulationGenerator] request success", { cacheKey });

      return {
        success: true,
        simulation: data.simulation,
        reasoning: data.reasoning,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          error: "Request cancelled",
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[simulationGenerator] request failure", { errorMessage });
      return {
        success: false,
        error: `Failed to generate simulation: ${errorMessage}`,
      };
    }
  }

  /**
   * Validate simulation config on the backend
   */
  async validateSimulation(
    config: SimulationConfig,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/validate-simulation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        return { valid: false, errors: ["Validation request failed"] };
      }

      return response.json();
    } catch (error) {
      return { valid: false, errors: ["Validation service unavailable"] };
    }
  }

  /**
   * Get example prompts and simulations
   */
  async getExamples(): Promise<
    {
      prompt: string;
      description: string;
    }[]
  > {
    return [
      {
        prompt: "Create a solar system with a sun and 3 planets orbiting",
        description: "Orbital mechanics simulation",
      },
      {
        prompt: "Show 3 red balls bouncing with low gravity",
        description: "Bouncing balls in low gravity",
      },
      {
        prompt: "Create a pendulum on the moon",
        description: "Pendulum motion with lunar gravity",
      },
      {
        prompt: "Simulate projectile motion with initial velocity 20m/s at 45 degrees",
        description: "Classic projectile motion",
      },
      {
        prompt: "Show a spring-mass system oscillating",
        description: "Spring oscillation",
      },
      {
        prompt: "Create a wave in water",
        description: "Wave simulation",
      },
    ];
  }
}

// Export singleton instance
export const simulationGenerator = new SimulationGeneratorService();

export default simulationGenerator;
