import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronRight,
  Brain,
  Sigma,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  Trophy,
  Lightbulb,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Plus,
  RefreshCcw,
  Loader2,
  Copy,
  Check,
  Award,
  BookMarked,
  Filter,
  Bookmark,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { type ClientMessage } from "@/components/chat/ChatMessage";
import { type ClientCitation } from "@/components/chat/CitationCard";
import {
  listClasses,
  listSubjects,
  listChapters,
  listTopics,
  type CurriculumNode,
} from "@/lib/tutor-api";

export const Route = createFileRoute("/tutor")({
  component: TutorPage,
  head: () => ({
    meta: [
      { title: "EduSim AI Tutor — NCERT Active Studio" },
      {
        name: "description",
        content:
          "High-fidelity educational tutor with hybrid RAG groundings, interactive physics sandboxes, and formula derivations.",
      },
    ],
  }),
});

function TutorPage() {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<ClientMessage[]>([
      {
        id: `msg-ai-${Date.now()}`,
        role: "assistant",
        content:
          "Welcome to EduSim AI Tutor. Ask a question and I will answer with textbook-grounded help and citations.",
        citations: [],
        timestamp: new Date().toISOString(),
        status: "idle",
      },
    ]);
    const [input, setInput] = useState("");

  function EmbeddedFormulaSheet() {
    const formulas = [
      {
        name: "Horizontal Range",
        latex: "R = \frac{u^2 \sin(2\theta)}{g}",
        note: "Maximum range occurs at 45° when air resistance is ignored.",
      },
      {
        name: "Time of Flight",
        latex: "T = \frac{2u \sin\theta}{g}",
        note: "Total time in air for a projectile launched and landing at the same height.",
      },
      {
        name: "Maximum Height",
        latex: "H = \frac{u^2 \sin^2\theta}{2g}",
        note: "Vertical peak reached by the projectile.",
      },
    ];

    return (
      <div className="glow-border rounded-xl p-4 my-2 border border-indigo-glow/30 bg-indigo-glow/5 animate-in fade-in-50 duration-300">
        <div className="text-[10px] uppercase font-bold text-indigo-glow tracking-wider mb-3">
          Formula Sheet
        </div>
        <div className="space-y-3">
          {formulas.map((formula) => (
            <div key={formula.name} className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-2">
                <Sigma className="h-3.5 w-3.5 text-cyan-glow" />
                {formula.name}
              </div>
              <div className="rounded-lg bg-white/5 px-3 py-2 text-sm font-mono text-cyan-glow overflow-x-auto">
                <BlockMath math={formula.latex} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                {formula.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
    const [isLoading, setIsLoading] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [activeCitation, setActiveCitation] = useState<ClientCitation | null>(null);
    const [latestCitations, setLatestCitations] = useState<ClientCitation[]>([]);
    const [classes, setClasses] = useState<CurriculumNode[]>([]);
    const [subjects, setSubjects] = useState<CurriculumNode[]>([]);
    const [chapters, setChapters] = useState<CurriculumNode[]>([]);
    const [topics, setTopics] = useState<CurriculumNode[]>([]);
    const [classFilter, setClassFilter] = useState("Class 9");
    const [subjectFilter, setSubjectFilter] = useState("Physics");
    const [chapterFilter, setChapterFilter] = useState("Motion");
    const [topicFilter, setTopicFilter] = useState("Projectile Motion");

    const createTimestamp = useCallback(() => new Date().toISOString(), []);

    const normalizeMessage = useCallback(
      (message: Partial<ClientMessage> & Pick<ClientMessage, "id" | "role" | "content" | "citations">): ClientMessage => ({
        ...message,
        timestamp: message.timestamp || createTimestamp(),
        citations: message.citations || [],
        status: message.status || (message.role === "assistant" ? "idle" : "idle"),
      }),
      [createTimestamp],
    );

    const buildWelcomeMessage = useCallback(
      (topic: string, chapter: string) =>
        normalizeMessage({
          id: `msg-ai-${Date.now()}`,
          role: "assistant",
          content: `Hi! I am your AI Tutor. Let's study **${topic}** under ${chapter}. Ask me questions, definitions, formulas, or request interactive step modules!`,
          citations: [],
        }),
      [normalizeMessage],
    );

    const loadCurriculum = useCallback(async () => {
      try {
        const classList = await listClasses();
        setClasses(classList || []);
        if (classList.length === 0) {
          setSubjects([]);
          setChapters([]);
          setTopics([]);
          return;
        }

        const matchedClass = classList.find((item) => item.name === classFilter) || classList[0];
        setClassFilter(matchedClass.name);

        const subjectList = await listSubjects(matchedClass.id);
        setSubjects(subjectList || []);
        if (subjectList.length === 0) {
          setChapters([]);
          setTopics([]);
          return;
        }

        const matchedSubject = subjectList.find((item) => item.name === subjectFilter) || subjectList[0];
        setSubjectFilter(matchedSubject.name);

        const chapterList = await listChapters(matchedSubject.id);
        setChapters(chapterList || []);
        if (chapterList.length === 0) {
          setTopics([]);
          return;
        }

        const matchedChapter = chapterList.find((item) => item.name === chapterFilter) || chapterList[0];
        setChapterFilter(matchedChapter.name);

        const topicList = await listTopics(matchedChapter.id);
        setTopics(topicList || []);
        if (topicList.length > 0) {
          const matchedTopic = topicList.find((item) => item.name === topicFilter) || topicList[0];
          setTopicFilter(matchedTopic.name);
        }
      } catch (error) {
        console.warn("Curriculum load failed, using fallback labels:", error);
        setClasses([]);
        setSubjects([]);
        setChapters([]);
        setTopics([]);
      }
    }, [chapterFilter, classFilter, subjectFilter, topicFilter]);

    useEffect(() => {
      loadCurriculum();
    }, [loadCurriculum]);

    useEffect(() => {
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isLoading, streamingText]);

    const handleClassChange = useCallback(async (value: string) => {
      setClassFilter(value);
      const matchedClass = classes.find((item) => item.name === value);
      if (!matchedClass) {
        setSubjects([]);
        setChapters([]);
        setTopics([]);
        return;
      }

      try {
        const subjectList = await listSubjects(matchedClass.id);
        setSubjects(subjectList || []);
        if (subjectList.length > 0) {
          const firstSubject = subjectList[0];
          setSubjectFilter(firstSubject.name);
          const chapterList = await listChapters(firstSubject.id);
          setChapters(chapterList || []);
          if (chapterList.length > 0) {
            const firstChapter = chapterList[0];
            setChapterFilter(firstChapter.name);
            const topicList = await listTopics(firstChapter.id);
            setTopics(topicList || []);
            if (topicList.length > 0) {
              setTopicFilter(topicList[0].name);
            }
          }
        }
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    }, [classes]);

    const handleSubjectChange = useCallback(async (value: string) => {
      setSubjectFilter(value);
      const matchedSubject = subjects.find((item) => item.name === value);
      if (!matchedSubject) {
        setChapters([]);
        setTopics([]);
        return;
      }

      try {
        const chapterList = await listChapters(matchedSubject.id);
        setChapters(chapterList || []);
        if (chapterList.length > 0) {
          const firstChapter = chapterList[0];
          setChapterFilter(firstChapter.name);
          const topicList = await listTopics(firstChapter.id);
          setTopics(topicList || []);
          if (topicList.length > 0) {
            setTopicFilter(topicList[0].name);
          }
        }
      } catch (error) {
        console.error("Error loading chapters:", error);
      }
    }, [subjects]);

    const handleChapterChange = useCallback(async (value: string) => {
      setChapterFilter(value);
      const matchedChapter = chapters.find((item) => item.name === value);
      if (!matchedChapter) {
        setTopics([]);
        return;
      }

      try {
        const topicList = await listTopics(matchedChapter.id);
        setTopics(topicList || []);
        if (topicList.length > 0) {
          setTopicFilter(topicList[0].name);
        }
      } catch (error) {
        console.error("Error loading topics:", error);
      }
    }, [chapters]);

    const anyMatches = useCallback((text: string, terms: string[]) => terms.some((term) => text.includes(term)), []);

    const classifyLocalQuery = useCallback((text: string) => {
      const lower = text.toLowerCase();
      if (anyMatches(lower, ["define", "definition", "what is", "meaning"])) return "definition";
      if (anyMatches(lower, ["formula", "equation", "express", "relation"])) return "formula-based";
      if (anyMatches(lower, ["derive", "derivation", "proof"])) return "derivation";
      if (anyMatches(lower, ["example", "illustration", "real life"])) return "example-based";
      if (anyMatches(lower, ["calculate", "solve", "numerical", "find"])) return "numerical";
      return "conceptual";
    }, [anyMatches]);

    const handleNewChat = useCallback(() => {
      setMessages([buildWelcomeMessage(topicFilter, chapterFilter)]);
      setActiveCitation(null);
      setLatestCitations([]);
      setStreamingText("");
      setInput("");
    }, [buildWelcomeMessage, chapterFilter, topicFilter]);

    const handleSendMessage = useCallback(async (messageText: string) => {
      const trimmedMessage = messageText.trim();
      if (!trimmedMessage || isLoading) return;

      const timestamp = createTimestamp();
      const userMessage = normalizeMessage({
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: trimmedMessage,
        citations: [],
        timestamp,
        status: "idle",
        sourcePrompt: trimmedMessage,
        queryIntent: classifyLocalQuery(trimmedMessage),
      });

      const assistantPlaceholderId = `msg-ai-loading-${Date.now()}`;
      const assistantPlaceholder = normalizeMessage({
        id: assistantPlaceholderId,
        role: "assistant",
        content: "",
        citations: [],
        timestamp,
        status: "streaming",
        sourcePrompt: trimmedMessage,
        queryIntent: userMessage.queryIntent,
      });

      const nextConversation = [...messages, userMessage, assistantPlaceholder];
      setMessages(nextConversation);
      setInput("");
      setActiveCitation(null);
      setLatestCitations([]);
      setIsLoading(true);
      setStreamingText("");

      try {
        const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || "http://127.0.0.1:8010";
        const chatHistory = messages.slice(-6).map((entry) => ({
          role: entry.role === "assistant" ? "assistant" : "user",
          content: entry.content,
        }));

        const requestPayload = {
          message: trimmedMessage,
          topic: topicFilter,
          class_name: classFilter,
          subject: subjectFilter,
          chapter: chapterFilter,
          chat_history: chatHistory,
        };

        console.log("[OUTGOING API REQUEST] POST /api/tutor/chat", requestPayload);
        const startedAt = performance.now();

        const response = await fetch(`${backendUrl}/api/tutor/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer dev-bypass-token",
          },
          body: JSON.stringify(requestPayload),
        });

        const duration = (performance.now() - startedAt).toFixed(1);
        if (!response.ok) {
          throw new Error(`Tutor API failure: ${response.status}`);
        }

        const payload = await response.json();
        console.log(`[BACKEND RESPONSE] Received payload in ${duration}ms:`, payload);

        // Auto-select detected subject/chapter/topic if returned!
        if (payload.inferred_context) {
          const inf = payload.inferred_context;
          if (inf.class && inf.class !== classFilter) {
            handleClassChange(inf.class);
          }
          if (inf.subject && inf.subject !== subjectFilter) {
            setSubjectFilter(inf.subject);
          }
          if (inf.chapter && inf.chapter !== chapterFilter) {
            setChapterFilter(inf.chapter);
          }
          if (inf.topic && inf.topic !== topicFilter) {
            setTopicFilter(inf.topic);
          }
        }

        const responseText = typeof payload.answer === "string"
          ? payload.answer
          : typeof payload.response === "string"
            ? payload.response
            : "No response received.";
        const retrievedChunks = Array.isArray(payload.retrieved_chunks) ? (payload.retrieved_chunks as ClientCitation[]) : [];
        const citations = retrievedChunks.length > 0
          ? retrievedChunks
          : Array.isArray(payload.citations)
            ? (payload.citations as ClientCitation[])
            : [];

        console.log("[MESSAGE STATE UPDATE] backend response payload merged into assistant bubble", {
          responseLength: responseText.length,
          citations: citations.length,
        });

        if (citations.length > 0) {
          setActiveCitation(citations[0]);
        }
        setLatestCitations(citations);

        let currentLength = 0;
        const interval = window.setInterval(() => {
          currentLength += Math.min(4, responseText.length - currentLength);
          const partial = responseText.slice(0, currentLength);
          setStreamingText(partial);

          setMessages((currentMessages) =>
            currentMessages.map((entry) =>
              entry.id === assistantPlaceholderId
                ? {
                    ...entry,
                    content: partial,
                    citations: currentLength >= responseText.length ? citations : entry.citations,
                    status: currentLength >= responseText.length ? "idle" : "streaming",
                  }
                : entry,
            ),
          );

          if (currentLength >= responseText.length) {
            clearInterval(interval);
            setIsLoading(false);
            setStreamingText("");
          }
        }, 15);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setStreamingText("");
        setLatestCitations([]);

        const errorMessage = normalizeMessage({
          id: assistantPlaceholderId,
          role: "assistant",
          content:
            "I could not reach the tutor backend just now. Please make sure the FastAPI server is running on http://127.0.0.1:8010 and try again.",
          citations: [],
          timestamp,
          status: "error",
          sourcePrompt: trimmedMessage,
          queryIntent: userMessage.queryIntent,
        });

        setMessages((currentMessages) =>
          currentMessages.map((entry) => (entry.id === assistantPlaceholderId ? errorMessage : entry)),
        );
      }
    }, [chapterFilter, classFilter, classifyLocalQuery, isLoading, messages, normalizeMessage, subjectFilter, topicFilter, createTimestamp]);

    const handleRetryMessage = useCallback(async (prompt: string) => {
      if (!prompt.trim()) return;
      await handleSendMessage(prompt);
    }, [handleSendMessage]);

    const handleCopy = useCallback((text: string) => {
      navigator.clipboard.writeText(text);
    }, []);

    const displayedCitations = useMemo(
      () => (latestCitations.length > 0 ? latestCitations : activeCitation ? [activeCitation] : []),
      [activeCitation, latestCitations],
    );
    const selectedCitation = activeCitation ?? displayedCitations[0] ?? null;

    return (
      <AppShell>
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr_340px] gap-5 h-[calc(100vh-6.5rem)] overflow-hidden">
          <aside className="glow-card rounded-2xl p-4 flex flex-col min-h-0 bg-surface/70 backdrop-blur-xl">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-glow to-purple-glow px-4 py-3 text-sm font-semibold text-white shadow-glow-indigo hover:opacity-90 transition mb-4 shrink-0"
            >
              <Plus className="h-4 w-4" /> New Study Thread
            </button>

            <div className="rounded-xl border border-border/80 bg-background/40 p-3 mb-4 space-y-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-glow mb-1">
                <Filter className="h-3 w-3" /> Syllabus Navigator
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Class Level</label>
                  <select value={classFilter} onChange={(e) => handleClassChange(e.target.value)} className="w-full rounded-lg border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-indigo-glow">
                    {classes.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    {classes.length === 0 && <option value="Class 9">Class 9</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Subject</label>
                  <select value={subjectFilter} onChange={(e) => handleSubjectChange(e.target.value)} className="w-full rounded-lg border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-indigo-glow">
                    {subjects.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    {subjects.length === 0 && <option value="Physics">Physics</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Active Chapter</label>
                  <select value={chapterFilter} onChange={(e) => handleChapterChange(e.target.value)} className="w-full rounded-lg border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-indigo-glow">
                    {chapters.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    {chapters.length === 0 && <option value="Motion">Motion</option>}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Target Topic</label>
                  <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="w-full rounded-lg border border-border bg-card/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-indigo-glow">
                    {topics.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                    {topics.length === 0 && <option value="Projectile Motion">Projectile Motion</option>}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-border/80 bg-background/40 p-3 text-xs flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-glow mb-3 flex items-center gap-1 select-none">
                  <Sparkles className="h-3 w-3" /> Inferred Syllabus Path
                </div>
                <div className="space-y-1.5 mb-4 select-none">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-border text-muted-foreground">{classFilter}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="px-1.5 py-0.5 rounded bg-cyan-glow/10 border border-cyan-glow/20 text-cyan-glow font-medium">{subjectFilter}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-glow/10 border border-indigo-glow/20 text-indigo-glow font-medium">{chapterFilter}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="px-1.5 py-0.5 rounded bg-purple-glow/10 border border-purple-glow/20 text-purple-glow font-medium max-w-[140px] truncate" title={topicFilter}>{topicFilter}</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-glow mb-2 flex items-center gap-1 select-none">
                  <Brain className="h-3 w-3" /> Suggested Next Topics
                </div>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {topics.filter(t => t.name !== topicFilter).slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTopicFilter(item.name)}
                      className="w-full text-left p-2 rounded-lg border border-border/40 bg-white/5 hover:bg-indigo-glow/10 hover:border-indigo-glow/30 transition text-[11px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <ArrowRight className="h-3 w-3 text-indigo-glow/60" />
                    </button>
                  ))}
                  {topics.filter(t => t.name !== topicFilter).length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic p-2 border border-dashed border-border/60 rounded-lg text-center">
                      No other topics in this chapter.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 shrink-0">
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Messages</div>
                  <div className="text-sm font-semibold text-foreground">{messages.length}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Citations</div>
                  <div className="text-sm font-semibold text-foreground">{displayedCitations.length}</div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-h-0 bg-surface/40 backdrop-blur-xl relative overflow-hidden rounded-2xl border border-border">
            <ChatContainer
              messages={messages}
              activeCitation={activeCitation}
              onSelectCitation={setActiveCitation}
              onCopy={handleCopy}
              onRegenerate={handleRetryMessage}
              isStreaming={isLoading}
              streamingText={streamingText}
              topicFilter={topicFilter}
              classFilter={classFilter}
              subjectFilter={subjectFilter}
              chapterFilter={chapterFilter}
              numericalModule={<InteractiveNumericalProblem />}
              formulaModule={<EmbeddedFormulaSheet />}
              derivationModule={<EmbeddedDerivationStepper />}
              exampleModule={<EmbeddedExampleCard />}
              quizModule={<InteractiveQuizCard onQuizFinished={() => undefined} />}
              simulatorModule={<LiveEmbeddedSimulator />}
            />

            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={handleSendMessage}
              isStreaming={isLoading}
              topicFilter={topicFilter}
            />
          </div>

          <aside className="glow-card rounded-2xl p-4 flex flex-col min-h-0 bg-surface/70 backdrop-blur-xl">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-glow mb-2.5 shrink-0">
                <BookOpen className="h-4 w-4" /> Grounded RAG Citation
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-3">
                {displayedCitations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/80 rounded-2xl bg-background/25">
                    <Bookmark className="h-7 w-7 text-muted-foreground/60 mb-2 animate-bounce" />
                    <div className="text-xs font-bold text-foreground mb-1">Interactive Textbook Groundings</div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Select a cited source marker in the tutoring chat box to inspect semantic scores, formulas, and exact NCERT textbook page references.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in-50 duration-300">
                    <div className="space-y-2">
                      {displayedCitations.slice(0, 5).map((citation, index) => (
                        <button
                          key={`${citation.metadata.chapter}-${citation.metadata.page}-${index}`}
                          type="button"
                          onClick={() => setActiveCitation(citation)}
                          className={cn(
                            "w-full rounded-xl border p-3 text-left transition",
                            selectedCitation === citation
                              ? "border-indigo-glow/50 bg-indigo-glow/10"
                              : "border-border bg-background/35 hover:bg-white/5",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {citation.metadata.chapter || "Textbook source"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">p.{citation.metadata.page}</div>
                          </div>
                          <div className="mt-1 text-[10px] text-muted-foreground truncate">
                            {citation.text.slice(0, 96)}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                              {(citation.semantic_score * 100).toFixed(0)}% semantic
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                              {(citation.keyword_score * 100).toFixed(0)}% keyword
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-indigo-glow/40 bg-indigo-glow/5 p-3">
                      <div className="text-[10px] font-bold uppercase text-indigo-glow tracking-wider mb-1">SOURCE DETAILS</div>
                      <div className="text-sm font-bold text-foreground truncate">{selectedCitation?.metadata.class} Physics</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {selectedCitation?.metadata.topic || "Textbook source"} · Ch.{selectedCitation?.metadata.chapter} · Page {selectedCitation?.metadata.page}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
                      <div className="text-[10px] font-bold uppercase text-cyan-glow tracking-wider">RELEVANCE SCORES</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[9px] text-muted-foreground">Semantic similarity</div>
                          <div className="font-semibold font-mono">{(selectedCitation?.semantic_score ?? 0) * 100}%</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground">Keyword matching</div>
                          <div className="font-semibold font-mono">{(selectedCitation?.keyword_score ?? 0) * 100}%</div>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-border/40">
                          <div className="text-[9px] text-indigo-glow font-bold">HYBRID INTEGRATION SCORE</div>
                          <div className="text-sm font-bold font-mono text-indigo-glow">{(selectedCitation?.hybrid_score ?? 0) * 100}%</div>
                        </div>
                      </div>
                    </div>

                    {(selectedCitation?.metadata.detected_chapter || selectedCitation?.metadata.detected_topic) && (
                      <div className="rounded-xl border border-border bg-background/40 p-3 text-[11px] space-y-1">
                        <div className="text-[10px] font-bold uppercase text-purple-glow tracking-wider mb-1">NCERT HIERARCHY</div>
                        {selectedCitation?.metadata.detected_chapter && <div className="text-foreground font-semibold truncate">{selectedCitation.metadata.detected_chapter}</div>}
                        {selectedCitation?.metadata.detected_topic && <div className="text-muted-foreground truncate">{selectedCitation.metadata.detected_topic}</div>}
                        {selectedCitation?.metadata.detected_section && <div className="text-[10px] text-muted-foreground truncate italic">Section: {selectedCitation.metadata.detected_section}</div>}
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-background/50 p-3 text-xs leading-relaxed">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-2">TEXTBOOK EXCERPT</div>
                      <div className="text-muted-foreground font-sans whitespace-pre-line italic bg-card/30 p-2.5 rounded-lg border border-border/30">
                        "{selectedCitation?.text}"
                      </div>
                    </div>

                    {selectedCitation?.metadata.semantic_keywords && (
                      <div className="rounded-xl border border-border bg-background/40 p-3 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">DERIVED PHRASES</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedCitation.metadata.semantic_keywords.split(",").slice(0, 8).map((kw, i) => (
                            <span key={i} className="text-[9px] rounded bg-white/5 border px-1.5 py-0.5 text-muted-foreground font-mono">
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </AppShell>
    );
  }
// Step-by-Step Derivation stepper component
function EmbeddedDerivationStepper() {
  const steps = [
    { title: "Split motion vectors", desc: "Express horizontal speed as $u_x = u\\cos\\theta$ and vertical speed as $u_y = u\\sin\\theta$." },
    { title: "Determine flight duration", desc: "Using vertical displacement equation, compute flight duration where $y=0$: $T = \\frac{2u\\sin\\theta}{g}$." },
    { title: "Substitute in horizontal motion", desc: "Plug $T$ into horizontal range $R = u_x T = (u\\cos\\theta)\\frac{2u\\sin\\theta}{g}$." },
    { title: "Apply trigonometric identity", desc: "Convert using identity $2\\sin\\theta\\cos\\theta = \\sin(2\\theta)$ to obtain final formula: $R = \\frac{u^2\\sin(2\\theta)}{g}$." }
  ];

  return (
    <div className="glow-border rounded-xl p-4 my-2 border border-cyan-glow/30 bg-cyan-glow/5 animate-in fade-in-50 duration-300">
      <div className="text-[10px] uppercase font-bold text-cyan-glow tracking-wider mb-3">Mathematical Derivation Stepper</div>
      
      <div className="space-y-4">
        {steps.map((st, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="h-5 w-5 rounded-full bg-cyan-glow/20 border border-cyan-glow grid place-items-center text-[10px] font-bold text-cyan-glow shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div className="text-xs">
              <span className="font-bold text-foreground block">{st.title}</span>
              <span className="text-muted-foreground leading-relaxed block mt-0.5">{st.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Numerical Slider Solver component
function InteractiveNumericalProblem() {
  const [v, setV] = useState(30);
  const [ang, setAng] = useState(45);
  const g = 9.8;

  const range = useMemo(() => {
    const rad = (ang * Math.PI) / 180;
    return ((v * v * Math.sin(2 * rad)) / g).toFixed(1);
  }, [v, ang]);

  const height = useMemo(() => {
    const rad = (ang * Math.PI) / 180;
    const sinSq = Math.sin(rad) * Math.sin(rad);
    return ((v * v * sinSq) / (2 * g)).toFixed(1);
  }, [v, ang]);

  return (
    <div className="glow-border rounded-xl p-4 my-2 border border-indigo-glow/30 bg-indigo-glow/5 animate-in fade-in-50 duration-300">
      <div className="text-[10px] uppercase font-bold text-indigo-glow tracking-wider mb-2">Dynamic Numerical Problem Solver</div>
      
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        <b>Question:</b> Find the horizontal range and max height of a ball kicked with a velocity of $u$ m/s at an angle of $\theta$ degrees (gravity $g = 9.8$ m/s²).
      </p>

      <div className="grid md:grid-cols-2 gap-4 border-t border-border/40 pt-3">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Velocity (u):</span>
              <span className="font-bold font-mono text-cyan-glow">{v} m/s</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              value={v}
              onChange={(e) => setV(parseInt(e.target.value))}
              className="w-full accent-cyan-glow cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Angle (θ):</span>
              <span className="font-bold font-mono text-indigo-glow">{ang}°</span>
            </div>
            <input
              type="range"
              min={10}
              max={85}
              value={ang}
              onChange={(e) => setAng(parseInt(e.target.value))}
              className="w-full accent-indigo-glow cursor-pointer"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card/85 p-3 flex flex-col justify-center gap-2.5">
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px]">HORIZONTAL RANGE (R)</span>
            <span className="text-base font-bold font-mono text-cyan-glow">{range} m</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px]">MAXIMUM VERTICAL HEIGHT (H)</span>
            <span className="text-base font-bold font-mono text-indigo-glow">{height} m</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Illustrated example card
function EmbeddedExampleCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glow-border rounded-xl p-4 my-2 border border-amber-glow/30 bg-amber-glow/5 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-glow tracking-wider mb-1">
        <Lightbulb className="h-4 w-4" /> Textbook Example Case
      </div>
      
      <span className="text-xs font-bold text-foreground block mb-1">Example 2.4: Motion in a Plane</span>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A stone is thrown horizontally from the top of a tower of height $19.6$ m with a velocity of $5$ m/s. How long does it take to hit the ground?
      </p>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-glow hover:underline transition"
      >
        {open ? "Fold solution" : "Reveal detailed solution walkthrough"} <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-95")} />
      </button>

      {open && (
        <div className="mt-2.5 pt-2.5 border-t border-border/40 text-xs text-muted-foreground space-y-2 animate-in slide-in-from-top-2 duration-300">
          <p>
            {"1. **Vertical Motion**: Initial vertical velocity $u_y = 0$. Vertical displacement $y = -19.6$ m. Gravity acceleration $g = -9.8$ m/s²."}
          </p>
          <p>
            {"2. Using formula $y = u_y t + 0.5 g t^2$:"}
          </p>
          <div className="text-center font-mono py-1">
            {"$$-19.6 = 0 - 0.5 (9.8) t^2$$"}
          </div>
          <div className="text-center font-mono py-1">
            {"$$19.6 = 4.9 t^2$$"}
          </div>
          <div className="text-center font-mono py-1">
            {"$$t^2 = 4 \\implies t = 2 \\text{ seconds.}$$"}
          </div>
          <p className="font-bold text-amber-glow">
            {"Ans: The stone takes exactly 2.0 seconds to touch the ground."}
          </p>
        </div>
      )}
    </div>
  );
}

// MCQs Quiz Card component
function InteractiveQuizCard({ onQuizFinished }: { onQuizFinished: () => void }) {
  const [ans, setAns] = useState<number | null>(null);
  const correctIdx = 1; // 45 degrees

  return (
    <div className="glow-border rounded-xl p-4 my-2 border border-purple-glow/30 bg-purple-glow/5 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-purple-glow tracking-wider mb-2">
        <HelpCircle className="h-4 w-4" /> Live Interactive Practice Quiz
      </div>

      <p className="text-xs font-bold text-foreground leading-relaxed mb-3">
        Question: To cover the maximum horizontal distance, at what launch angle should a football player kick the ball?
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        {[
          { label: "30° Angle", idx: 0 },
          { label: "45° Optimal", idx: 1 },
          { label: "60° Angle", idx: 2 },
          { label: "90° Vertical", idx: 3 }
        ].map((opt) => {
          const finished = ans !== null;
          const isThisCorrect = opt.idx === correctIdx;
          const isThisPicked = ans === opt.idx;
          
          return (
            <button
              key={opt.idx}
              disabled={finished}
              onClick={() => {
                setAns(opt.idx);
                if (opt.idx === correctIdx) {
                  onQuizFinished();
                }
              }}
              className={cn(
                "rounded-xl border p-2.5 text-left text-xs transition",
                !finished && "border-border/60 bg-background/50 hover:bg-white/5 hover:border-indigo-glow",
                finished && isThisCorrect && "border-emerald-glow bg-emerald-glow/10 text-emerald-glow font-bold",
                finished && isThisPicked && !isThisCorrect && "border-destructive bg-destructive/10 text-destructive",
                finished && !isThisPicked && !isThisCorrect && "opacity-40"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {ans !== null && (
        <div className="mt-3 pt-3 border-t border-border/40 text-xs">
          {ans === correctIdx ? (
            <div className="flex items-center gap-1.5 text-emerald-glow font-bold">
              <CheckCircle2 className="h-4 w-4" /> Excellent! +100 XP awarded.
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-destructive font-bold">
              <XCircle className="h-4 w-4" /> Not quite right. Review horizontal ranges.
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
            <b>{"Explanation: "}</b>
            {"Horizontal range formula is $R = \\frac{u^2 \\sin(2\\theta)}{g}$. Max range occurs when \\sin(2\\theta) peaks at 1.0, which means 2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$."}
          </p>
        </div>
      )}
    </div>
  );
}

// Live Embedded trajectory canvas physics simulator
function LiveEmbeddedSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [vel, setVel] = useState(30);
  const [ang, setAng] = useState(45);
  const [play, setPlay] = useState(false);
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);
  const g = 9.8;

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Draw cosmic coordinate grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Draw launching launcher base pad
      ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
      ctx.beginPath();
      ctx.arc(30, H - 30, 8, 0, Math.PI * 2);
      ctx.fill();

      const rad = (ang * Math.PI) / 180;
      const ux = vel * Math.cos(rad);
      const uy = vel * Math.sin(rad);
      const flightTime = (2 * uy) / g;
      const scale = Math.min((W - 65) / ((vel * vel) / g + 0.01), 6.5);
      const groundY = H - 30;

      // Draw dashed trajectory pathway vector
      ctx.beginPath();
      ctx.strokeStyle = "rgba(6,182,212,0.45)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      for (let s = 0; s <= flightTime; s += flightTime / 100) {
        const x = 30 + ux * s * scale;
        const y = groundY - (uy * s - 0.5 * g * s * s) * scale;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Compute moving projectile position
      const currentT = Math.min(tRef.current, flightTime);
      const bx = 30 + ux * currentT * scale;
      const by = groundY - (uy * currentT - 0.5 * g * currentT * currentT) * scale;

      // Draw glowing neon projectile ball
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(99,102,241,0.85)";
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw metrics overlay on canvas
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "10px monospace";
      ctx.fillText(`Flight Time: ${currentT.toFixed(2)}s`, 15, 20);
      ctx.fillText(`Range (R): ${((vel * vel * Math.sin(2 * rad)) / g).toFixed(1)}m`, 15, 35);
      ctx.fillText(`Height (H): ${((uy * uy) / (2 * g)).toFixed(1)}m`, 15, 50);

      if (play) {
        tRef.current += 0.02;
        if (tRef.current > flightTime) {
          tRef.current = 0;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [vel, ang, play]);

  const handleReset = () => {
    tRef.current = 0;
    setPlay(false);
  };

  return (
    <div className="glow-border rounded-xl p-4 my-2 border border-cyan-glow/30 bg-cyan-glow/5 max-w-full overflow-hidden animate-in fade-in-50 duration-300">
      <div className="text-[10px] uppercase font-bold text-cyan-glow tracking-wider mb-2">Live Embedded Vector Physics Sandbox</div>

      <div className="grid md:grid-cols-[1fr_200px] gap-3">
        <div className="rounded-xl border border-border bg-background/90 overflow-hidden relative min-h-[220px]">
          <canvas ref={canvasRef} width={500} height={230} className="w-full h-full block" />
        </div>

        <div className="flex flex-col gap-2.5 justify-center">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Speed (u):</span>
              <span className="font-bold font-mono text-cyan-glow">{vel} m/s</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              value={vel}
              onChange={(e) => setVel(parseInt(e.target.value))}
              className="w-full accent-cyan-glow cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Angle (θ):</span>
              <span className="font-bold font-mono text-purple-glow">{ang}°</span>
            </div>
            <input
              type="range"
              min={15}
              max={80}
              value={ang}
              onChange={(e) => setAng(parseInt(e.target.value))}
              className="w-full accent-purple-glow cursor-pointer"
            />
          </div>

          <div className="flex gap-2 mt-1.5">
            <button
              onClick={() => setPlay(!play)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-cyan-glow to-indigo-glow px-2.5 py-1.5 text-[11px] font-bold text-background hover:opacity-90"
            >
              {play ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {play ? "Pause" : "Start"}
            </button>
            
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-border/80 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
