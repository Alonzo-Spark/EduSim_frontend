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

export interface ChatMessage {
  role: "user" | "assistant" | "ai";
  content: string;
}

export const TutorService = {
  analyzeQuery: async (
    query: string, 
    context?: { class_name?: string; subject?: string; chapter?: string; topic?: string },
    history?: ChatMessage[],
    sessionId?: string | null,
    signal?: AbortSignal
  ): Promise<TutorAnalysisResponse & { session_id?: string }> => {
    const body = {
      query,
      class_name: context?.class_name,
      subject: context?.subject,
      chapter: context?.chapter,
      topic: context?.topic,
      history: history ? history.map(h => ({
        role: h.role === "ai" ? "assistant" : h.role,
        content: h.content
      })) : undefined,
      session_id: sessionId || undefined
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

  analyzeQueryStream: async (
    query: string,
    context?: { class_name?: string; subject?: string; chapter?: string; topic?: string },
    history?: ChatMessage[],
    sessionId?: string | null,
    onChunk?: (content: string) => void,
    onRagContent?: (rag: any[]) => void,
    onStructured?: (structured: any) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const body = {
      query,
      class_name: context?.class_name,
      subject: context?.subject,
      chapter: context?.chapter,
      topic: context?.topic,
      history: history ? history.map(h => ({
        role: h.role === "ai" ? "assistant" : h.role,
        content: h.content
      })) : undefined,
      session_id: sessionId || undefined
    };

    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(joinUrl(API_BASE, "/api/tutor/analyze-stream"), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Failed to start streaming query");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.content !== undefined && onChunk) {
                onChunk(data.content);
              }
              if (data.ragContent !== undefined && onRagContent) {
                onRagContent(data.ragContent);
              }
              if (data.structured !== undefined && onStructured) {
                onStructured(data.structured);
              }
            } catch (e) {
              console.error("[TutorService] Failed to parse SSE data:", dataStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  getSessions: async (): Promise<{ success: boolean; sessions: any[] }> => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(joinUrl(API_BASE, "/api/persistence/tutor/sessions"), {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tutor sessions");
    }
    return response.json();
  },

  getSessionMessages: async (sessionId: string): Promise<{ success: boolean; session: any }> => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(joinUrl(API_BASE, `/api/persistence/tutor/session/${sessionId}`), {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch session messages");
    }
    return response.json();
  },

  deleteSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(joinUrl(API_BASE, `/api/persistence/tutor/session/${sessionId}`), {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to delete tutor session");
    }
    return response.json();
  },
};
