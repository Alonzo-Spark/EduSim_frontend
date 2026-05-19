import { Brain, Copy, RefreshCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InlineMath } from "react-katex";
import { cn } from "@/lib/utils";
import { CitationCard, type ClientCitation } from "./CitationCard";
import { TypingIndicator } from "./TypingIndicator";

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ClientCitation[];
  timestamp: string;
  sourcePrompt?: string;
  status?: "sending" | "streaming" | "error" | "idle";
  queryIntent?: "conceptual" | "formula-based" | "numerical" | "derivation" | "definition" | "example-based";
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: ClientMessage;
  activeCitation: ClientCitation | null;
  onSelectCitation: (citation: ClientCitation) => void;
  onCopy: (text: string) => void;
  onRegenerate: (text: string) => void;
  
  // Custom modules matching syllabus query intents
  numericalModule?: React.ReactNode;
  formulaModule?: React.ReactNode;
  derivationModule?: React.ReactNode;
  exampleModule?: React.ReactNode;
  quizModule?: React.ReactNode;
  simulatorModule?: React.ReactNode;
}

export function ChatMessage({
  message,
  activeCitation,
  onSelectCitation,
  onCopy,
  onRegenerate,
  numericalModule,
  formulaModule,
  derivationModule,
  exampleModule,
  quizModule,
  simulatorModule,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isLoadingAssistant = !isUser && (message.status === "streaming" || message.status === "sending") && !message.content.trim();

  const renderRichContent = (content: string) => {
    if (!content.trim()) {
      return null;
    }

    const segments: Array<{ type: "text" | "inlineMath" | "blockMath"; value: string }> = [];
    const mathPattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

    let lastIndex = 0;
    for (const match of content.matchAll(mathPattern)) {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        segments.push({ type: "text", value: content.slice(lastIndex, index) });
      }

      if (match[1]) {
        segments.push({ type: "blockMath", value: match[1].trim() });
      } else if (match[2]) {
        segments.push({ type: "inlineMath", value: match[2].trim() });
      }

      lastIndex = index + match[0].length;
    }

    if (lastIndex < content.length) {
      segments.push({ type: "text", value: content.slice(lastIndex) });
    }

    if (segments.length === 0) {
      segments.push({ type: "text", value: content });
    }

    return segments.map((segment, index) => {
      if (segment.type === "inlineMath") {
        return (
          <span key={index} className="inline-flex items-center rounded-md bg-indigo-glow/15 px-1.5 py-0.5 text-indigo-glow">
            <InlineMath math={segment.value} />
          </span>
        );
      }

      if (segment.type === "blockMath") {
        return (
          <div key={index} className="my-2 overflow-x-auto rounded-xl border border-indigo-glow/25 bg-indigo-glow/10 px-3 py-2 text-center text-indigo-glow">
            <InlineMath math={segment.value} />
          </div>
        );
      }

      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node: _node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
            code: ({ node: _node, className, children, ...props }) => (
              <code
                className={cn(
                  "rounded-md border border-border/60 bg-black/20 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-glow",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            ),
          }}
        >
          {segment.value}
        </ReactMarkdown>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[92%] md:max-w-[84%] flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Bot Avatar */}
        {!isUser && (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-glow to-purple-glow grid place-items-center shrink-0 shadow-glow-indigo/20 select-none">
            <Brain className="h-4 w-4 text-white" />
          </div>
        )}

        <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end" : "items-start")}>
          {/* Message Bubble Container */}
          <div
            className={cn(
              "rounded-xl px-4 py-3.5 text-sm leading-relaxed border shadow-sm transition-all duration-200 backdrop-blur-sm",
              isUser
                ? "bg-gradient-to-br from-sky-500 via-indigo-500 to-cyan-500 border-sky-300/20 text-white ml-auto shadow-[0_16px_48px_rgba(59,130,246,0.2)]"
                : "bg-slate-950/55 border-white/10 text-foreground/90 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap font-medium">{message.content}</div>
            ) : isLoadingAssistant ? (
              <TypingIndicator isStreaming={true} />
            ) : (
              <div className="space-y-4">
                {/* Rich Styled Custom Query Types */}
                {message.queryIntent && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-border/40 px-2.5 py-0.5 text-[10px] uppercase font-bold text-cyan-glow select-none">
                    <Sparkles className="h-3 w-3 text-cyan-glow animate-pulse" /> {message.queryIntent} insight
                  </div>
                )}

                {/* Markdown text parse rendering */}
                <div className="prose prose-invert max-w-none prose-p:my-2 prose-strong:text-indigo-glow prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-headings:mb-2 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                  {renderRichContent(message.content)}
                </div>

                {/* Interactive Dynamic Syllabus Modules */}
                {message.queryIntent === "numerical" && numericalModule}
                {message.queryIntent === "formula-based" && formulaModule}
                {message.queryIntent === "derivation" && derivationModule}
                {message.queryIntent === "example-based" && exampleModule}

                {/* MCQs Practice Quiz Module */}
                {message.content.toLowerCase().includes("quiz") && quizModule}

                {/* Interactive trajectory canvas simulator */}
                {(message.content.toLowerCase().includes("simulation") ||
                  message.content.toLowerCase().includes("simulate")) &&
                  simulatorModule}

                {/* Grounding citations row */}
                <CitationCard
                  citations={message.citations}
                  activeCitation={activeCitation}
                  onSelectCitation={onSelectCitation}
                />
              </div>
            )}
          </div>

          {/* Action Bar */}
          {!isUser && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground ml-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
              <button
                type="button"
                onClick={() => onCopy(message.content)}
                className="p-1 hover:text-foreground transition rounded hover:bg-white/5 cursor-pointer"
                title="Copy reply text"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRegenerate(message.sourcePrompt || message.content)}
                className="p-1 hover:text-foreground transition rounded hover:bg-white/5 cursor-pointer"
                title="Regenerate reply"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </button>
              {message.status === "error" && (
                <button
                  type="button"
                  onClick={() => onRegenerate(message.sourcePrompt || message.content)}
                  className="rounded-md border border-border/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground transition hover:bg-white/5"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {isUser && (
            <span className="mr-1 text-[10px] text-muted-foreground/70">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
