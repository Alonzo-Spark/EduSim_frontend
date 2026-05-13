/**
 * Tutor Page Route
 * AI-powered physics tutor for students
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { TutorInputPanel } from "@/components/tutor/TutorInputPanel";
import { TutorOutputPanel } from "@/components/tutor/TutorOutputPanel";
import { TutorService, TutorAnalysisResponse } from "@/services/TutorService";
import { useSimulationStore } from "@/store/useSimulationStore";
import { TutorOutputSkeleton } from "@/components/loaders/TutorSkeletons";
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
  const [searchQuery, setSearchQuery] = useState("");

  const { 
    setTutorResponse, 
    simulationGenerated, 
    simulationData, 
    resetGenerationState 
  } = useSimulationStore();
  
  const { data: topicContent, loading: topicLoading, fetchTopic } = useCurriculumTopic();

  // Load topic content from search params
  useEffect(() => {
    if (searchParams.subject && searchParams.class_name && searchParams.chapter) {
      setIsLoading(true);
      
      // Build search query string for display
      const queryParts = [
        searchParams.topic,
        searchParams.chapter,
        searchParams.subject,
        searchParams.class_name,
      ].filter(Boolean);
      setSearchQuery(queryParts.join(" - "));

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
    setIsLoading(true);
    setError(null);
    try {
      const response = await TutorService.analyzeQuery(query);
      if (response.success) {
        setTutorData(response.data);
        setTutorResponse(response.data); // Sync with store for FAB
      } else {
        setError("Failed to analyze question.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while contacting the tutor service.");
    } finally {
      setIsLoading(false);
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
    <div className="w-full text-foreground pt-2 pb-8">
      {/* Display current search context */}
      {searchQuery && !simulationGenerated && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-primary font-medium">
            📚 Currently viewing: <span className="opacity-80">{searchQuery}</span>
          </p>
        </div>
      )}

      {/* Main RAG-powered interactive tutor UI structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input Panel */}
        <div className="min-w-0 sticky top-32">
          <TutorInputPanel 
            onAnalyze={handleAnalyze} 
            isLoading={isLoading} 
            initialValue={searchQuery}
            curriculumContext={
              searchParams.subject && searchParams.chapter
                ? {
                    subject: searchParams.subject,
                    chapter: searchParams.chapter,
                    topic: searchParams.topic,
                  }
                : undefined
            }
          />
        </div>

        {/* Right: Output/Analysis */}
        <div className="min-w-0 min-h-[600px] flex flex-col">
          {isLoading || topicLoading ? (
            <TutorOutputSkeleton />
          ) : (
            <TutorOutputPanel 
              data={displayData} 
              className="flex-1"
              selectedTopic={
                searchParams.subject && searchParams.chapter
                  ? {
                      subject: searchParams.subject,
                      chapter: searchParams.chapter,
                      topic: searchParams.topic,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Embedded high-fidelity overlay satisfying explicit floating sandbox constraints */}
      <FloatingSimulationWorkspaceOverlay 
        isOpen={simulationGenerated}
        onClose={resetGenerationState}
        simulation={simulationData || { title: searchQuery || "AI Dynamic Simulation Sandbox" }}
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
