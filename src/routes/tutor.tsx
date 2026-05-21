/**
 * Tutor Page Route
 * AI-powered physics tutor for students
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import ChatWorkspace from "@/components/tutor/ChatWorkspace";
import { TutorService, TutorAnalysisResponse } from "@/services/TutorService";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useCurriculumTopic } from "@/hooks/useCurriculumTopic";
import { FloatingSimulationWorkspaceOverlay } from "@/components/simulation/FloatingSimulationWorkspaceOverlay";

// Define search params for the route
export const Route = createFileRoute("/tutor")({
  component: TutorPage,
  validateSearch: (search: Record<string, unknown>) => ({
    subject: typeof search.subject === "string" ? search.subject : undefined,
    class_name: typeof search.class_name === "string" ? search.class_name : undefined,
    chapter: typeof search.chapter === "string" ? search.chapter : undefined,
    topic: typeof search.topic === "string" ? search.topic : undefined,
    prompt: typeof search.prompt === "string" ? search.prompt : undefined,
  }),
});

function TutorPage() {
  const searchParams = Route.useSearch();
  const [tutorData, setTutorData] = useState<TutorAnalysisResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setTutorResponse, simulationGenerated, simulationData, resetGenerationState } =
    useSimulationStore();

  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const { data: topicContent, loading: topicLoading, fetchTopic } = useCurriculumTopic();

  // Load topic content from search params
  useEffect(() => {
    if (searchParams.subject && searchParams.class_name && searchParams.chapter) {
      setIsLoading(true);

      // Fetch topic content
      fetchTopic(
        searchParams.subject,
        searchParams.class_name,
        searchParams.chapter,
        searchParams.topic,
      ).then(() => {
        setIsLoading(false);
      });
    }
  }, [searchParams, fetchTopic]);

  const handleAnalyze = async (query: string) => {
    // Cancel previous request if still pending
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const response = await TutorService.analyzeQuery(query, controller.signal);
      if (response.success) {
        setTutorData(response.data);
        setTutorResponse(response.data); // Sync with store for FAB
      } else {
        setError("Failed to analyze question.");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // request was aborted; do nothing
      } else {
        console.error("Tutor analyze error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while contacting the tutor service.",
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = undefined;
    }
  };

  const compactTopicContext = topicContent
    ? {
        subject: topicContent.subject,
        className: topicContent.class_name,
        chapter: topicContent.chapter,
      }
    : {
        subject: searchParams.subject,
        className: searchParams.class_name,
        chapter: searchParams.chapter,
      };

  const tutorStateMessage = topicLoading
    ? "Searching textbook content..."
    : isLoading
      ? "Generating explanation..."
      : null;

  return (
    <div className="relative w-full h-full overflow-hidden text-foreground bg-background">
      {tutorStateMessage && (
        <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-muted-foreground backdrop-blur-md">
          {tutorStateMessage}
        </div>
      )}

      <div className="relative mx-auto flex h-full w-full max-w-[100rem] items-stretch">
        <div className="flex w-full items-stretch flex-1 min-w-0">
          <ChatWorkspace
            onSend={handleAnalyze}
            aiResponse={tutorData?.explanation || tutorData?.ai_explanation || null}
            loading={isLoading || topicLoading}
            initialPrompt={
              searchParams.prompt ||
              (searchParams.topic ? `Explain ${searchParams.topic}` : undefined)
            }
            focusInput={Boolean(searchParams.prompt || searchParams.topic)}
            topicTitle={searchParams.topic || searchParams.chapter}
            topicContext={compactTopicContext}
          />
        </div>
      </div>

      {/* Embedded high-fidelity overlay satisfying explicit floating sandbox constraints */}
      <FloatingSimulationWorkspaceOverlay
        isOpen={simulationGenerated}
        onClose={resetGenerationState}
        simulation={
          simulationData
            ? {
                dsl: simulationData,
                metadata: {
                  subject: searchParams.subject,
                  topic: searchParams.topic,
                  chapter: searchParams.chapter,
                  class_name: searchParams.class_name,
                },
                title: `${searchParams.topic} - ${searchParams.subject}`,
              }
            : undefined
        }
      />

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 max-w-md animate-in slide-in-from-right-8 shadow-2xl backdrop-blur-md z-50">
          <p className="text-sm text-red-400 font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
