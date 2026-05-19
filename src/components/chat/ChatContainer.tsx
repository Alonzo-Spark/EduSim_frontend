import { useRef, useEffect } from "react";
import { Sparkles, Brain, BookOpen, MessageCircle, RefreshCcw } from "lucide-react";
import { ChatMessage, type ClientMessage } from "./ChatMessage";
import type { ClientCitation } from "./CitationCard";

interface ChatContainerProps {
  messages: ClientMessage[];
  activeCitation: ClientCitation | null;
  onSelectCitation: (citation: ClientCitation) => void;
  onCopy: (text: string) => void;
  onRegenerate: (text: string) => void;
  isStreaming: boolean;
  streamingText: string;
  topicFilter: string;
  classFilter: string;
  subjectFilter: string;
  chapterFilter: string;
  
  // Dynamic modules
  numericalModule?: React.ReactNode;
  formulaModule?: React.ReactNode;
  derivationModule?: React.ReactNode;
  exampleModule?: React.ReactNode;
  quizModule?: React.ReactNode;
  simulatorModule?: React.ReactNode;
}

export function ChatContainer({
  messages,
  activeCitation,
  onSelectCitation,
  onCopy,
  onRegenerate,
  isStreaming,
  streamingText,
  topicFilter,
  classFilter,
  subjectFilter,
  chapterFilter,
  numericalModule,
  formulaModule,
  derivationModule,
  exampleModule,
  quizModule,
  simulatorModule,
}: ChatContainerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isStreaming, streamingText]);

  const isEmpty = messages.length === 0;

  return (
    <section className="glow-card rounded-2xl flex flex-col min-h-0 bg-surface/40 backdrop-blur-xl relative flex-1 h-full overflow-hidden">
      {/* Workspace Topic Banner */}
      <header className="border-b border-border p-4 flex items-center justify-between bg-card/10 shrink-0 select-none">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="text-[10px] text-indigo-glow uppercase tracking-wider font-bold truncate">
            {classFilter} · {subjectFilter} · {chapterFilter}
          </div>
          <h1 className="text-lg font-bold font-display text-foreground truncate">
            {topicFilter} Tutoring Hub
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-glow animate-pulse-glow" />
          <span className="text-[10px] text-emerald-glow font-bold uppercase tracking-wider">RAG Online</span>
        </div>
      </header>

      {/* Messages conversational stream / Empty Screen */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin bg-gradient-to-b from-transparent to-background/20"
      >
        {isEmpty ? (
          <div className="min-h-[calc(100%-2rem)] flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto select-none animate-in fade-in duration-500">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-glow to-purple-glow grid place-items-center mb-6 shadow-glow-indigo/35 animate-float-slow">
              <Brain className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2 justify-center">
              NCERT Textbook Grounded Studio <Sparkles className="h-5 w-5 text-indigo-glow animate-pulse" />
            </h2>
            
            <p className="text-xs text-muted-foreground leading-relaxed mt-2.5 mb-6">
              Welcome to the active educational studio. Every response is grounded inside textbook chapters mapping your <strong className="text-indigo-glow">{topicFilter}</strong> syllabus. Ask any conceptual query to begin!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left text-xs">
              <div className="rounded-xl border border-border/80 bg-white/5 p-3 flex gap-2.5 items-start">
                <BookOpen className="h-4.5 w-4.5 text-indigo-glow shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Verified Grounding</span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                    Responses are sourced directly from textbook pages with verified citations.
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border/80 bg-white/5 p-3 flex gap-2.5 items-start">
                <Sparkles className="h-4.5 w-4.5 text-cyan-glow shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Active Modules</span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed block mt-0.5">
                    Launch MCQs practice quizzes, range calculators, and HTML5 canvas labs!
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 text-indigo-glow" />
              Start a conversation to see live bubbles, citations, and typing feedback.
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                activeCitation={activeCitation}
                onSelectCitation={onSelectCitation}
                onCopy={onCopy}
                onRegenerate={onRegenerate}
                numericalModule={numericalModule}
                formulaModule={formulaModule}
                derivationModule={derivationModule}
                exampleModule={exampleModule}
                quizModule={quizModule}
                simulatorModule={simulatorModule}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
