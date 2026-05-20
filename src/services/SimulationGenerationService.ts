/**
 * Simulation Generation Service
 * Typed API client for topic-based simulation generation
 */

export interface TopicSimulationRequest {
  subject: string;
  class_name: string;
  chapter: string;
  topic: string;
}

export interface PhysicsObject {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  shape?: {
    type: "circle" | "rectangle";
    radius?: number;
    width?: number;
    height?: number;
  };
  physics: {
    mass: number;
    restitution: number;
    friction: number;
    isStatic: boolean;
  };
  visual: {
    color: string;
    opacity: number;
  };
}

export interface SimulationDSL {
  meta?: {
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    explanation?: string;
  };
  environment?: {
    gravity?: number;
    friction?: number;
    background?: string;
  };
  objects: PhysicsObject[];
  interactions?: any[];
  forces?: any[];
  formulas?: any[];
}

export interface SimulationMetadata {
  subject: string;
  topic: string;
  runtime: "matter_js" | "graph_renderer" | "diagram_animator" | "geometry_renderer";
  rendererType?: "physics" | "graph" | "diagram" | "hybrid";
  explanation?: string;
  concepts?: string[];
  formulas?: any[];
}

export interface SimulationConfig {
  scene?: any;
  runtime?: any;
  controls?: any[];
  graphs?: any[];
}

export interface TopicSimulationResponse {
  success: boolean;
  dsl: SimulationDSL;
  metadata: SimulationMetadata;
  config: SimulationConfig;
  scene?: any;
  physics?: any;
  simulation?: {
    title: string;
    description?: string;
    environment: {
      width: number;
      height: number;
      gravity: number;
      airResistance?: number;
      timeScale?: number;
    };
    objects: PhysicsObject[];
  };
  simulation_type?: string;
  formulas?: any[];
  controls?: any;
  graphs?: any[];
  error?: string;
}

import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";

class SimulationGenerationService {
  private baseUrl = getApiUrl("");

  async generateTopicSimulation(
    request: TopicSimulationRequest
  ): Promise<TopicSimulationResponse> {
    try {
      const response = await fetch(joinUrl(this.baseUrl, "/api/generate/topic"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to generate simulation (HTTP ${response.status})`
        );
      }

      const data: TopicSimulationResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Simulation generation failed");
      }

      if (!data.simulation && data.scene) {
        data.simulation = {
          title: data.scene.title || data.dsl?.meta?.title || request.topic,
          description: data.scene.description || data.dsl?.meta?.description,
          environment: {
            width: data.scene.environment?.world?.width || 800,
            height: data.scene.environment?.world?.height || 600,
            gravity: data.scene.environment?.gravity?.y || 9.8,
            airResistance: data.scene.environment?.airResistance || 0.005,
            timeScale: 1,
          },
          objects: data.scene.objects || [],
        };
      }

      return data;
    } catch (error) {
      console.error("Simulation generation error:", error);
      throw error;
    }
  }
}

export default new SimulationGenerationService();
