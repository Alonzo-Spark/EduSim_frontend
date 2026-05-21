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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10">
            <BookOpen className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Practice Q&A</h2>
            <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Score</p>
          <p className="text-xl font-black text-violet-400">{score}/{questions.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`rounded-3xl border border-white/10 bg-white/5 p-8 transition-all duration-300 ${
            isSubmitted ? (isCorrect ? 'border-green-500/30 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-red-500/30 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.1)]') : 'shadow-xl'
          }`}
        >
          <h3 className="text-xl font-semibold leading-relaxed text-foreground/90 whitespace-pre-wrap">
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
                    className={`p-4 rounded-xl border text-left font-medium transition-all ${
                      answers[currentQ.id] === opt
                        ? 'border-violet-500 bg-violet-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10 hover:border-white/20'
                    } ${isSubmitted ? 'cursor-not-allowed opacity-80' : ''} ${
                      isSubmitted && opt === currentQ.correctAnswer ? 'border-green-500 bg-green-500/20 text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''
                    } ${
                      isSubmitted && answers[currentQ.id] === opt && opt !== currentQ.correctAnswer ? 'border-red-500 bg-red-500/20 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''
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
                  className="w-full sm:max-w-md bg-black/20 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50 text-lg"
                />
              </div>
            )}

            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={!answers[currentQ.id]}
                className="mt-8 rounded-xl bg-violet-600 hover:bg-violet-500 px-8 py-3 font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className="mt-2 text-foreground/80 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="mt-6 flex items-center gap-2 rounded-xl bg-white text-black hover:bg-white/90 px-8 py-3 font-bold shadow-xl transition-all"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="mt-8 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl text-center shadow-lg">
                    <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">🎉 Practice Complete!</h4>
                    <p className="text-lg text-violet-200/90 mb-6">You scored <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{questions.length}</span></p>
                    <button
                      onClick={() => {
                        setCurrentIndex(0);
                        setAnswers({});
                        setSubmitted({});
                        setScore(0);
                      }}
                      className="px-8 py-3 rounded-xl bg-white text-violet-900 font-bold hover:bg-violet-100 transition-all shadow-xl hover:shadow-violet-500/20 active:scale-95"
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
