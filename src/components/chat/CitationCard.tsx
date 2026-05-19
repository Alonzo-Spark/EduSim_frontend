import { BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientCitation {
  text: string;
  metadata: {
    class: string;
    subject: string;
    chapter: string;
    topic: string;
    page: number;
    chunk_index?: number;
    detected_chapter?: string;
    detected_topic?: string;
    detected_section?: string;
    semantic_keywords?: string;
  };
  relevance_score: number;
  semantic_score: number;
  keyword_score: number;
  hybrid_score: number;
}

interface CitationCardProps {
  citations: ClientCitation[];
  activeCitation: ClientCitation | null;
  onSelectCitation: (citation: ClientCitation) => void;
}

export function CitationCard({
  citations,
  activeCitation,
  onSelectCitation,
}: CitationCardProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <BookMarked className="h-3.5 w-3.5 text-indigo-glow" /> Textbook Grounding
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((cit, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectCitation(cit)}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-lg border px-3 py-1.5 transition duration-200 cursor-pointer",
              activeCitation === cit
                ? "bg-indigo-glow/20 border-indigo-glow text-foreground shadow-glow-indigo/10"
                : "bg-white/5 border-border/80 text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-glow shrink-0" />
            <span className="truncate">[{idx + 1}] {cit.metadata.chapter || "Syllabus"}</span>
            <span className="text-[10px] font-normal text-muted-foreground/80">
              p.{cit.metadata.page} · {(cit.relevance_score * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
