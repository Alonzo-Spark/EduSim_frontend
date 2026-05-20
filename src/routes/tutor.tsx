/**
 * Tutor Page Route
 * AI-powered physics tutor for students
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import ChatWorkspace from "@/components/tutor/ChatWorkspace";
import TextbookResourcesPanel from "@/components/tutor/TextbookResourcesPanel";
import VerticalResourcesToggle from "@/components/tutor/VerticalResourcesToggle";
import { TutorService, TutorAnalysisResponse } from "@/services/TutorService";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useCurriculumTopic } from "@/hooks/useCurriculumTopic";
import { FloatingSimulationWorkspaceOverlay } from "@/components/simulation/FloatingSimulationWorkspaceOverlay";

// Define search params for the route
export const Route = createFileRoute("/tutor")({
  component: TutorPage,
  validateSearch: (search: any) => ({
    subject: search?.subject as string | undefined,
    class_name: search?.class_name as string | undefined,
    chapter: search?.chapter as string | undefined,
    topic: search?.topic as string | undefined,
  }),
});

function TutorPage() {
  const searchParams = Route.useSearch();
  const [tutorData, setTutorData] = useState<TutorAnalysisResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const { 
    setTutorResponse, 
    simulationGenerated, 
    simulationData, 
    resetGenerationState 
  } = useSimulationStore();

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
        searchParams.topic
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // request was aborted; do nothing
      } else {
        console.error('Tutor analyze error:', err);
        setError(err.message || "An error occurred while contacting the tutor service.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = undefined;
    }
  };

  // Display topic content if loaded from search params
  const displayData = topicContent
    ? {
        title: topicContent.topic || topicContent.chapter,
        description: `${topicContent.subject} • ${topicContent.class_name}`,
        ai_explanation: topicContent.ai_explanation || `
## ${topicContent.topic || topicContent.chapter}

**Class:** ${topicContent.class_name}  
**Subject:** ${topicContent.subject}  
**Chapter:** ${topicContent.chapter}

### Learning Outcomes
${topicContent.outcomes?.map((o) => `- ${o}`).join("\n") || "No outcomes available"}

### Prerequisites
${topicContent.prerequisites?.map((p) => `- ${p}`).join("\n") || "No prerequisites"}

### Related Topics
${topicContent.related_concepts?.map((c) => `- ${c}`).join("\n") || "No related concepts"}
        `,
        concepts: topicContent.related_concepts || [],
        formulas: topicContent.related_formulas || [],
        sources: [],
      }
    : tutorData;

  return (
    <div className="relative w-full h-screen overflow-hidden text-foreground">
      <div className="relative mx-auto flex h-full w-full max-w-[96rem] items-stretch px-4 sm:px-6 lg:px-8">
        <div className="flex w-full items-stretch">
          <ChatWorkspace
            onSend={handleAnalyze}
            aiResponse={displayData?.ai_explanation || displayData?.explanation || null}
            loading={isLoading || topicLoading}
          />
        </div>

        <VerticalResourcesToggle onToggle={() => setResourcesOpen((s) => !s)} open={resourcesOpen} />
        <TextbookResourcesPanel open={resourcesOpen} onClose={() => setResourcesOpen(false)} subject={searchParams.subject} />
      </div>

      {/* Embedded high-fidelity overlay satisfying explicit floating sandbox constraints */}
      <FloatingSimulationWorkspaceOverlay 
        isOpen={simulationGenerated}
        onClose={resetGenerationState}
        simulation={simulationData ? {
          dsl: simulationData,
          metadata: {
            subject: searchParams.subject,
            topic: searchParams.topic,
            chapter: searchParams.chapter,
            class_name: searchParams.class_name,
          },
          title: `${searchParams.topic} - ${searchParams.subject}`,
        } : undefined}
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
