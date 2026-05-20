import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";

export interface TutorAnalysisResponse {
  success: boolean;
  data: {
    queryType: string;
    concepts: string[];
    formulas: Array<{
      formula: string;
      name: string;
      topic: string;
      meaning: string;
    }>;
    explanation: string;
    ragContent: Array<{
      title: string;
      content: string;
    }>;
  };
}

const API_BASE = getApiUrl("");

export const TutorService = {
  analyzeQuery: async (query: string, signal?: AbortSignal): Promise<TutorAnalysisResponse> => {
    const response = await fetch(joinUrl(API_BASE, "/api/tutor/analyze"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Failed to analyze query");
    }

    return response.json();
  },
};
