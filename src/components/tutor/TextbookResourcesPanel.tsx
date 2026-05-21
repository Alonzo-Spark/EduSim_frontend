import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

interface Chapter {
  title: string;
  sections: string[];
}

const SAMPLE_CHAPTERS: Chapter[] = [
  { title: "Chapter 1: The Living World", sections: ["1.1 Overview", "1.2 Key Concepts", "1.3 Summary"] },
  { title: "Chapter 2: Biological Classification", sections: ["2.1 Overview", "2.2 Key Concepts", "2.3 Summary"] },
  { title: "Chapter 3: Plant Kingdom", sections: ["3.1 Overview", "3.2 Key Concepts", "3.3 Summary"] },
];

import { CLASSES } from "@/data/curriculum";

interface Props {
  subject?: string;
  topic?: string | null;
  open: boolean;
  onClose: () => void;
}

export function TextbookResourcesPanel({ subject = "Biology", topic = null, open, onClose }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  // derive resources from curriculum data when topic prop provided
  const deriveResources = (topic?: string | null) => {
    if (!topic) return null;
    const q = topic.toLowerCase();
    const matches: { title: string; type: string; url?: string; source?: string }[] = [];

    for (const cls of CLASSES) {
      for (const subj of cls.subjects) {
        const chapters = subj.chapters && Array.isArray(subj.chapters) ? subj.chapters as any[] : [];
        for (const ch of chapters) {
          if ((ch.name || "").toLowerCase().includes(q)) {
            matches.push({ title: `${ch.name} - ${subj.name}`, type: "Chapter PDF", url: `#` });
          }
          const topics = ch.topics || [];
          for (const t of topics) {
            if ((t.name || "").toLowerCase().includes(q)) {
              matches.push({ title: `${t.name} — ${ch.name}`, type: "Notes", url: `#` });
              matches.push({ title: `${t.name} — Practice Questions`, type: "Practice", url: `#` });
              matches.push({ title: `${t.name} — Intro Video`, type: "Video", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(t.name)}` });
            }
          }
        }
      }
    }

    // dedupe
    const uniq: typeof matches = [];
    const seen = new Set<string>();
    for (const m of matches) {
      if (!seen.has(m.title + m.type)) {
        seen.add(m.title + m.type);
        uniq.push(m);
      }
    }

    return uniq.slice(0, 12);
  };

  const topicResources = deriveResources(topic ?? null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close resources"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] sm:hidden"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background/92 shadow-2xl border-l border-border z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-background/92 p-4 border-b border-border z-40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Textbook Resources</h3>
                <p className="text-xs text-muted-foreground">Browse your textbook resources</p>
                {topic && (
                  <div className="text-sm text-muted-foreground mt-1">Resources for "{topic}"</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select className="rounded-xl p-2 border border-border bg-secondary/20">
                  <option>Biology</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Mathematics</option>
                </select>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary/30">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {topicResources ? (
                <div className="space-y-3">
                  {topicResources.map((r, idx) => (
                    <div key={`${r.title}-${idx}`} className="rounded-2xl border border-border bg-secondary/10 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold">{r.title}</div>
                          <div className="text-xs text-muted-foreground">{r.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={r.url || '#'} target="_blank" rel="noreferrer" className="text-sm text-primary font-bold">Open</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                SAMPLE_CHAPTERS.map((ch, idx) => (
                  <div key={ch.title} className="rounded-2xl border border-border bg-secondary/10">
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [idx]: !s[idx] }))}
                      className="w-full p-3 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold">{ch.title}</h4>
                        <p className="text-xs text-muted-foreground">Chapter overview and resources</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expanded[idx] ? 'rotate-180' : ''}`} />
                    </button>

                    {expanded[idx] && (
                      <div className="p-3 border-t border-border">
                        {ch.sections.map((s) => (
                          <div key={s} className="p-3 rounded-xl hover:bg-secondary/30 transition-colors border border-border/20 mb-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold">{s}</div>
                                <div className="text-xs text-muted-foreground">Pages 1–12</div>
                              </div>
                              <button className="text-sm text-primary font-bold">Open</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TextbookResourcesPanel;
