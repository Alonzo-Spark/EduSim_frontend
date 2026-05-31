import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";

interface QASectionProps {
  topic: string;
  chapter?: string;
  subject?: string;
  formulas?: DynamicParsedFormula[] | null;
  ragContent?: string;
}

type QuestionType = "multiple-choice" | "fill-blanks" | "concept";

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QASection({ topic, formulas }: QASectionProps) {
  const isNewton = topic.toLowerCase().includes("newton") || 
                   (formulas && formulas.some(f => f.title?.toLowerCase().includes("newton")));

  // 6 Demo Questions as requested: 3 MC, 2 Fill blanks, 1 Concept
  const demoQuestions: QuizQuestion[] = [
    {
      id: "q1", type: "multiple-choice",
      question: "What is the SI unit of force?",
      options: ["Joule", "Newton", "Watt", "Pascal"],
      correctAnswer: "Newton",
      explanation: "The SI unit of force is the Newton (N), which is equivalent to 1 kg·m/s²."
    },
    {
      id: "q2", type: "multiple-choice",
      question: "If the mass of an object is kept constant, what happens to the force if the acceleration is doubled?",
      options: ["It is halved", "It remains the same", "It is doubled", "It is quadrupled"],
      correctAnswer: "It is doubled",
      explanation: "Since F = m × a, force is directly proportional to acceleration when mass is constant. Doubling acceleration doubles the force."
    },
    {
      id: "q3", type: "multiple-choice",
      question: "Which of the following describes mass in Newton's Second Law?",
      options: ["A measure of velocity", "A vector quantity", "A scalar quantity measuring inertia", "A unit of force"],
      correctAnswer: "A scalar quantity measuring inertia",
      explanation: "Mass is a scalar quantity that represents an object's resistance to acceleration (inertia)."
    },
    {
      id: "q4", type: "fill-blanks",
      question: "Newton's Second Law states:\nF = ___ × a",
      correctAnswer: "m",
      explanation: "Force (F) equals Mass (m) multiplied by Acceleration (a)."
    },
    {
      id: "q5", type: "fill-blanks",
      question: "If a force of 20N is applied to a 5kg mass, the acceleration is ___ m/s².",
      correctAnswer: "4",
      explanation: "Since F = ma, a = F/m. 20 / 5 = 4 m/s²."
    },
    {
      id: "q6", type: "concept",
      question: "Concept: Does an object require a net force to stay in motion at a constant velocity?",
      options: ["Yes, a constant force is required", "No, net force must be zero", "Yes, but only in a vacuum"],
      correctAnswer: "No, net force must be zero",
      explanation: "According to Newton's First Law, an object at constant velocity has zero acceleration. By Newton's Second Law (F=ma), if a=0, net Force must be 0."
    }
  ];

  const genericQuestions = [
    {
      id: "q1", type: "multiple-choice",
      question: `What does ${formulas?.[0]?.resultSymbol || 'the result'} represent in this formula?`,
      options: ["Rate of change", "Constant", formulas?.[0]?.title || "The main variable", "Energy"],
      correctAnswer: formulas?.[0]?.title || "The main variable",
      explanation: "This is derived from the formula's primary purpose."
    }
  ] as QuizQuestion[];

  const questions = isNewton ? demoQuestions : genericQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);

  if (!formulas || formulas.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isSubmitted = submitted[currentQ.id];
  const isCorrect = isSubmitted && answers[currentQ.id]?.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }));
  };

  const handleTextChange = (value: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
  };

  const handleSubmit = () => {
    if (!answers[currentQ.id]) return;
    setSubmitted(prev => ({ ...prev, [currentQ.id]: true }));
    if (answers[currentQ.id]?.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim()) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center border border-violet-150 shadow-sm">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Practice Q&A</h2>
            <p className="text-xs font-semibold text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Score</p>
          <p className="text-xl font-black text-violet-600">{score}/{questions.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`rounded-3xl border p-8 transition-all duration-300 ${
            isSubmitted 
              ? (isCorrect 
                  ? 'border-green-200 bg-green-50/20 shadow-[0_8px_30px_rgba(34,197,94,0.04)]' 
                  : 'border-red-200 bg-red-50/20 shadow-[0_8px_30px_rgba(239,68,68,0.04)]') 
              : 'border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]'
          }`}
        >
          <h3 className="text-lg font-bold leading-relaxed text-slate-800 whitespace-pre-wrap">
            {currentQ.question}
          </h3>

          <div className="mt-8">
            {(currentQ.type === "multiple-choice" || currentQ.type === "concept") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isSubmitted}
                    className={`p-4 rounded-xl border text-left font-semibold text-sm transition-all duration-200 ${
                      answers[currentQ.id] === opt
                        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm'
                        : 'border-slate-100 bg-slate-50/40 text-slate-600 hover:bg-slate-100/50 hover:text-slate-800'
                    } ${isSubmitted ? 'cursor-not-allowed opacity-80' : ''} ${
                      isSubmitted && opt === currentQ.correctAnswer ? 'border-green-500 bg-green-50 text-green-700 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : ''
                    } ${
                      isSubmitted && answers[currentQ.id] === opt && opt !== currentQ.correctAnswer ? 'border-red-500 bg-red-50 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === "fill-blanks" && (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleTextChange(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Type your answer..."
                  className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50 text-slate-850 text-lg"
                />
              </div>
            )}

            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={!answers[currentQ.id]}
                className="mt-8 rounded-xl bg-violet-600 hover:bg-violet-500 px-8 py-3 font-bold text-white shadow-md shadow-violet-600/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Submit Answer
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <div className={`p-5 rounded-2xl border ${
                  isCorrect ? 'bg-green-50 border-green-150 text-green-800' : 'bg-red-50 border-red-150 text-red-800'
                }`}>
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-lg font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className="mt-2 text-slate-700 font-normal leading-relaxed text-sm">
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-8 py-3 font-bold shadow-md transition-all active:scale-95"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="mt-8 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl text-center shadow-lg shadow-violet-100/10">
                    <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-650 mb-2">🎉 Practice Complete!</h4>
                    <p className="text-base text-slate-600 font-semibold mb-6">You scored <span className="font-extrabold text-violet-600">{score}</span> out of <span className="font-extrabold text-slate-800">{questions.length}</span></p>
                    <button
                      onClick={() => {
                        setCurrentIndex(0);
                        setAnswers({});
                        setSubmitted({});
                        setScore(0);
                      }}
                      className="px-8 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 shadow-md shadow-violet-600/15 transition-all active:scale-95 cursor-pointer"
                    >
                      Retry Practice
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
