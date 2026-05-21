import React, { useState } from "react";
import { ParsedFormula } from "@/utils/FormulaExtractor";
import { getFormulaLabProfile } from "@/data/formulaLabProfiles";

const PracticeQuestions: React.FC<{ formula: ParsedFormula | null }> = ({ formula }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const profile = formula ? getFormulaLabProfile(formula.profileId || formula.id) : undefined;

  if (!formula || !profile) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Practice Questions</p>
        <h3 className="mt-2 text-xl font-bold">Easy, medium, hard</h3>
      </div>
      <div className="grid gap-4">
        {profile.practiceQuestions.map((question, index) => (
          <div key={question.question} className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{question.difficulty}</span>
              <button className="text-sm font-semibold text-violet-300" onClick={() => setRevealed((current) => ({ ...current, [index]: !current[index] }))}>
                {revealed[index] ? "Hide answer" : "Reveal answer"}
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-foreground/90">{question.question}</p>
            {revealed[index] && (
              <div className="mt-4 space-y-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm">
                <div><span className="font-bold">Answer:</span> {question.answer}</div>
                <div className="text-muted-foreground"><span className="font-bold text-foreground">Solution:</span> {question.solution}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeQuestions;
