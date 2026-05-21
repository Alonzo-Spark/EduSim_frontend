import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChatBubble, TypingAnimation } from "./ChatBubble";
import ChatInput from "./ChatInput";
import { TutorHeader } from "./TutorHeader";
import { Sparkles, Lightbulb, ListChecks, HelpCircle } from "lucide-react";
import { useTutorStore } from "@/store/tutorStore";

interface Props {
  onSend: (text: string) => void;
  aiResponse?: string | null;
  loading?: boolean;
  initialPrompt?: string | null;
  focusInput?: boolean;
}

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
};

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatWorkspace({ onSend, aiResponse, loading }: Props) {
  // props updated below; include initialPrompt and focusInput from parent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const initialPrompt = (arguments[0] as any)?.initialPrompt as string | null | undefined;
  const focusInput = (arguments[0] as any)?.focusInput as boolean | undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastAiResponseRef = useRef<string | null>(null);

  const { activeFormulaId } = useTutorStore();

  const send = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: formatTime(new Date()),
      },
    ]);
    setPendingPrompt(text);
    onSend(text);
  };

  // If a parent passes an initial prompt, auto-send it on mount
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      // allow render to settle
      const t = setTimeout(() => {
        send(initialPrompt!.trim());
      }, 120);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      send(lastUser.content);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setPendingPrompt(null);
    lastAiResponseRef.current = null;
  };

  useEffect(() => {
    if (!loading && aiResponse) {
      const shouldAppend = pendingPrompt !== null || messages.length === 0 || lastAiResponseRef.current !== aiResponse;
      if (shouldAppend) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "ai",
            content: aiResponse,
            timestamp: formatTime(new Date()),
          },
        ]);
        lastAiResponseRef.current = aiResponse;
        setPendingPrompt(null);
      }
    }
  }, [aiResponse, loading, messages.length, pendingPrompt]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, aiResponse]);

  const latestHint = useMemo(() => {
    if (loading) return "Thinking...";
    if (messages.length === 0) return "What would you like to learn today?";
    return null;
  }, [loading, messages.length]);

  const suggestions = [
    { label: "Explain a concept", icon: Lightbulb, prompt: "Explain a concept in simple terms." },
    { label: "Summarize a chapter", icon: ListChecks, prompt: "Summarize this chapter in clear bullet points." },
    { label: "Generate quiz questions", icon: HelpCircle, prompt: "Generate quiz questions on this topic." },
    { label: "Solve a problem", icon: Sparkles, prompt: "Help me solve a problem step by step." },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full max-w-none overflow-hidden relative">
      <TutorHeader onNewChat={handleNewChat} />

      <main 
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 custom-scrollbar pb-28 pt-2 space-y-8 flex"
        style={{ minHeight: 0 }}
      >
        <div className={`mx-auto w-full max-w-[950px] h-full flex flex-col ${messages.length === 0 ? "items-center justify-center" : ""} space-y-6`}>
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center w-full">
              <div className="w-full max-w-[48rem] rounded-[1.75rem] border border-white/10 bg-white/[0.035] px-6 py-6 sm:px-8 sm:py-8 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-[2rem] font-semibold tracking-tight text-foreground">{latestHint}</h3>
                    <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
                      Ask anything about your chapter, concept, or problem. The conversation will feel like a premium AI workspace.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                    {suggestions.map(({ label, icon: Icon, prompt }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => send(prompt)}
                        className="group flex items-center gap-4 rounded-2xl border border-border/45 bg-black/10 px-4 py-4 text-left transition-all hover:border-violet-400/35 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 transition-transform group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground">{label}</div>
                          <div className="text-xs text-muted-foreground">Start a guided conversation</div>
                        </div>
                        <div className="text-muted-foreground/70 transition-transform group-hover:translate-x-0.5">›</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              content={m.content}
              timestamp={m.timestamp}
              onCopy={m.role === "ai" ? () => navigator.clipboard?.writeText(m.content) : undefined}
              onRegenerate={m.role === "ai" ? handleRegenerate : undefined}
            />
          ))}

          {loading && (
            <div className="flex items-center gap-3 pl-1 py-2">
              <TypingAnimation />
              <span className="text-xs text-muted-foreground">{latestHint}</span>
            </div>
          )}

          <div ref={bottomRef} className="h-6 w-full" />
        </div>
      </main>
      <ChatInput onSend={send} disabled={loading} focus={Boolean(focusInput)} />
    </div>
  );
}

export default ChatWorkspace;
