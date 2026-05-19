import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, RefreshCcw, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import {
  getChapters,
  getClasses,
  getSubjects,
  getTopics,
  sendTutorMessage,
  type TutorCitation,
} from "@/lib/tutor-api";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "AI Tutor — EduSim" }] }),
});

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: TutorCitation[];
  createdAt: string;
  temp?: boolean;
};

function ChatPage() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [selectedCitations, setSelectedCitations] = useState<TutorCitation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [classId, setClassId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);

  const classesQ = useQuery({
    queryKey: ["curriculum", "classes"],
    queryFn: async () => {
      const items = await getClasses();
      return Array.isArray(items) ? items : [];
    },
    retry: false,
  });

  const subjectsQ = useQuery({
    queryKey: ["curriculum", "subjects", classId],
    queryFn: async () => {
      if (classId === null) {
        return [];
      }
      const items = await getSubjects(classId);
      return Array.isArray(items) ? items : [];
    },
    enabled: classId !== null,
    retry: false,
  });

  const chaptersQ = useQuery({
    queryKey: ["curriculum", "chapters", subjectId],
    queryFn: async () => {
      if (subjectId === null) {
        return [];
      }
      const items = await getChapters(subjectId);
      return Array.isArray(items) ? items : [];
    },
    enabled: subjectId !== null,
    retry: false,
  });

  const topicsQ = useQuery({
    queryKey: ["curriculum", "topics", chapterId],
    queryFn: async () => {
      if (chapterId === null) {
        return [];
      }
      const items = await getTopics(chapterId);
      return Array.isArray(items) ? items : [];
    },
    enabled: chapterId !== null,
    retry: false,
  });

  const selectedClass = classesQ.data?.find((item) => item.id === classId) ?? null;
  const selectedSubject = subjectsQ.data?.find((item) => item.id === subjectId) ?? null;
  const selectedChapter = chaptersQ.data?.find((item) => item.id === chapterId) ?? null;
  const selectedTopic = topicsQ.data?.find((item) => item.id === topicId) ?? null;

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = (text: string) => {
    if (!text.trim() || isStreaming) {
      return;
    }

    const trimmed = text.trim();
    const now = new Date().toISOString();
    const assistantMessageId = `assistant-${Date.now()}`;

    setInput("");
    setSelectedCitations([]);
    setMessages((previous) => [
      ...previous,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        citations: [],
        createdAt: now,
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        citations: [],
        createdAt: now,
        temp: true,
      },
    ]);

    setIsStreaming(true);

    void sendTutorMessage({
      message: trimmed,
      topic: selectedTopic?.name ?? "General tutoring",
      class_name: selectedClass?.name ?? "General",
      subject: selectedSubject?.name ?? "General",
      chapter: selectedChapter?.name ?? undefined,
      chat_history: messages
        .filter((message) => !message.temp)
        .map((message) => ({ role: message.role, content: message.content })),
    })
      .then((result) => {
        const response = result.answer || result.response || "No response received.";
        const citations = Array.isArray(result.retrieved_chunks)
          ? result.retrieved_chunks
          : Array.isArray(result.citations)
            ? result.citations
            : [];
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: response,
                  citations,
                  temp: false,
                }
              : message,
          ),
        );
        setSelectedCitations(citations);
      })
      .catch((error) => {
        setMessages((previous) =>
          previous
            .filter((message) => message.id !== assistantMessageId)
            .concat({
              id: `error-${Date.now()}`,
              role: "assistant",
              content: `I could not reach the tutor backend: ${error instanceof Error ? error.message : "unknown error"}`,
              citations: [],
              createdAt: new Date().toISOString(),
            }),
        );
      })
      .finally(() => {
        setIsStreaming(false);
      });
  };

  const handleRegenerate = (assistantMessageId: string) => {
    const assistantIndex = messages.findIndex((message) => message.id === assistantMessageId);
    if (assistantIndex <= 0) {
      return;
    }

    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "user") {
        handleSend(message.content);
        return;
      }
    }
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 h-[calc(100vh-7rem)]">
        <aside className="glow-card rounded-2xl p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Curriculum
          </div>

          <CurriculumFilters
            classId={classId}
            setClassId={(value) => {
              setClassId(value);
              setSubjectId(null);
              setChapterId(null);
              setTopicId(null);
            }}
            subjectId={subjectId}
            setSubjectId={(value) => {
              setSubjectId(value);
              setChapterId(null);
              setTopicId(null);
            }}
            chapterId={chapterId}
            setChapterId={(value) => {
              setChapterId(value);
              setTopicId(null);
            }}
            topicId={topicId}
            setTopicId={setTopicId}
            classes={classesQ.data ?? []}
            subjects={subjectsQ.data ?? []}
            chapters={chaptersQ.data ?? []}
            topics={topicsQ.data ?? []}
          />

          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setSelectedCitations([]);
            }}
            className="mt-3 rounded-xl border border-border bg-white/5 px-3 py-2 text-sm text-left hover:bg-white/10 transition"
          >
            Start a new local chat session
          </button>
        </aside>

        <section className="glow-card rounded-2xl flex flex-col min-h-0">
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && !isStreaming && <EmptyState onPick={setInput} />}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSelectCitations={setSelectedCitations}
                onRegenerate={handleRegenerate}
              />
            ))}

            {isStreaming && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                EduSim is thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
            className="border-t border-border p-3 flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(input);
                }
              }}
              rows={1}
              placeholder="Ask your textbook doubt, request formulas, or get a step-by-step solution…"
              className="flex-1 resize-none rounded-xl border border-border bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-border-glow max-h-40"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-r from-cyan-glow to-indigo-glow text-background disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="glow-card rounded-2xl p-4 flex flex-col min-h-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            Citations
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {selectedCitations.length === 0 ? (
              <div className="text-muted-foreground">
                Select an assistant reply to inspect sources.
              </div>
            ) : (
              selectedCitations.map((citation) => (
                <div
                  key={`${citation.id}-${citation.citationNumber}`}
                  className="rounded-lg bg-white/5 p-2"
                >
                  <div className="text-foreground font-semibold">
                    [{citation.citationNumber}] {citation.sourceFile}
                  </div>
                  <div className="text-muted-foreground">
                    p.{citation.page} · score {(citation.score * 100).toFixed(0)}%
                  </div>
                  <div className="mt-1 text-muted-foreground">{citation.excerpt}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function CurriculumFilters(props: {
  classId: number | null;
  setClassId: (value: number | null) => void;
  subjectId: number | null;
  setSubjectId: (value: number | null) => void;
  chapterId: number | null;
  setChapterId: (value: number | null) => void;
  topicId: number | null;
  setTopicId: (value: number | null) => void;
  classes: Array<{ id: number; name: string }>;
  subjects: Array<{ id: number; name: string }>;
  chapters: Array<{ id: number; name: string }>;
  topics: Array<{ id: number; name: string }>;
}) {
  return (
    <div className="space-y-2 text-xs">
      <FilterSelect
        label="Class"
        value={props.classId}
        onChange={props.setClassId}
        options={props.classes}
      />
      <FilterSelect
        label="Subject"
        value={props.subjectId}
        onChange={props.setSubjectId}
        options={props.subjects}
      />
      <FilterSelect
        label="Chapter"
        value={props.chapterId}
        onChange={props.setChapterId}
        options={props.chapters}
      />
      <FilterSelect
        label="Topic"
        value={props.topicId}
        onChange={props.setTopicId}
        options={props.topics}
      />
    </div>
  );
}

function FilterSelect(props: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  options: Array<{ id: number; name: string }>;
}) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {props.label}
      </div>
      <select
        value={props.value ?? ""}
        onChange={(event) => props.onChange(event.target.value ? Number(event.target.value) : null)}
        className="w-full rounded-lg border border-border bg-white/5 px-2 py-1.5 text-xs"
      >
        <option value="">All</option>
        {props.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function MessageBubble(props: {
  message: LocalMessage;
  onSelectCitations: (citations: TutorCitation[]) => void;
  onRegenerate: (assistantMessageId: string) => void;
}) {
  const isUser = props.message.role === "user";
  const citations = Array.isArray(props.message.citations) ? props.message.citations : [];

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
          isUser
            ? "bg-gradient-to-br from-cyan-glow/20 to-indigo-glow/20 border-indigo-glow/30"
            : "bg-white/5 border-border",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{props.message.content}</div>
        ) : (
          <div className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-headings:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.message.content}</ReactMarkdown>
          </div>
        )}

        {!isUser && citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
            <button
              type="button"
              onClick={() => props.onSelectCitations(citations)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
            >
              <BookOpen className="h-3 w-3" /> View citations ({citations.length})
            </button>
          </div>
        )}

        {!isUser && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => props.onRegenerate(props.message.id)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <RefreshCcw className="h-3 w-3" /> Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "Define Newton's second law with examples",
    "Derive the range formula for projectile motion",
    "Explain chemical equilibrium step by step",
    "Give me a short quiz on optics refraction",
  ];

  return (
    <div className="h-full grid place-items-center">
      <div className="text-center max-w-md">
        <div className="grid h-14 w-14 place-items-center mx-auto rounded-2xl bg-gradient-to-br from-cyan-glow to-indigo-glow mb-4">
          <Sparkles className="h-6 w-6 text-background" />
        </div>
        <h2 className="text-xl font-bold mb-2">Ask your AI tutor</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Get textbook-grounded explanations, formulas, and citations with streaming responses.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onPick(suggestion)}
              className="text-left text-xs rounded-xl border border-border bg-white/5 hover:bg-white/10 p-3 transition"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}