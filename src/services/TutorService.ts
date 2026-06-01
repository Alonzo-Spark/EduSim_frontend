import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";
import { useAuthStore } from "@/store/useAuthStore";

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
  analyzeQuery: async (
    query: string, 
    context?: { class_name?: string; subject?: string; chapter?: string; topic?: string },
    signal?: AbortSignal
  ): Promise<TutorAnalysisResponse> => {
    const body = {
      query,
      class_name: context?.class_name,
      subject: context?.subject,
      chapter: context?.chapter,
      topic: context?.topic
    };
    
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(joinUrl(API_BASE, "/api/tutor/analyze"), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Failed to analyze query");
    }

    return response.json();
  },
};
