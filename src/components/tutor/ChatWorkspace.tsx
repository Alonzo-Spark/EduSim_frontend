import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChatBubble, TypingAnimation } from "./ChatBubble";
import ChatInput from "./ChatInput";
import { TutorHeader } from "./TutorHeader";

interface Props {
  onSend: (text: string) => void;
  aiResponse?: string | null;
  loading?: boolean;
  initialPrompt?: string | null;
  focusInput?: boolean;
  topicTitle?: string;
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

export function ChatWorkspace({ onSend, aiResponse, loading, initialPrompt, focusInput, topicTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastAiResponseRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
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
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, aiResponse]);

  const topics = ["Physics", "Chemistry", "Biology", "Math", "History", "Coding"];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full relative bg-transparent">
      <TutorHeader onNewChat={handleNewChat} topicTitle={topicTitle} />

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className={`mx-auto w-full max-w-[850px] min-h-full flex flex-col px-4 sm:px-6 pb-40 pt-6 ${messages.length === 0 ? "justify-center" : "justify-start"} space-y-6`}>
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center w-full space-y-10 mt-[-5vh]">
              <div className="text-center space-y-3">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 px-4 py-1.5 mb-2">
                   <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">AI Tutor</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                  What would you like to learn today?
                </h2>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => send(`Let's learn about ${t}`)}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105"
                  >
                    {t}
                  </button>
                ))}
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
            <div className="flex w-full items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] glow-purple">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="pt-2">
                <TypingAnimation />
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-10 w-full shrink-0" />
        </div>
      </main>

      <ChatInput onSend={send} disabled={loading} focus={Boolean(focusInput)} />
    </div>
  );
}

export default ChatWorkspace;
