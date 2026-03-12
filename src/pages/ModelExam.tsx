import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Loader2, ArrowLeft, RefreshCw, CheckCircle2,
  Sparkles, Clock, Play, ChevronRight, ChevronLeft, BookOpen, Timer,
  AlertTriangle, Eye, Trophy, Target, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { domains } from "@/data/domains";
import { generateQuestions, type Question } from "@/lib/api";
import { useUsage } from "@/hooks/useUsage";
import { toast } from "sonner";
import jsPDF from "jspdf";

const letters = ["A", "B", "C", "D"] as const;

interface ExamQuestion extends Question {
  topic: string;
  domain: string;
  unitIndex: number;
}

// NJSLA Unit definitions
const EXAM_UNITS = [
  {
    id: "unit1",
    title: "Unit 1 — Ratios & Number System",
    subtitle: "6.RP.1–6.RP.3, 6.NS.1–6.NS.8",
    emoji: "📐",
    domainIds: ["whole-numbers", "integers", "fractions", "decimals", "ratios", "measurements"],
    duration: 40,
  },
  {
    id: "unit2",
    title: "Unit 2 — Expressions & Equations",
    subtitle: "6.EE.1–6.EE.9",
    emoji: "🧮",
    domainIds: ["exponents", "algebra", "equations"],
    duration: 40,
  },
  {
    id: "unit3",
    title: "Unit 3 — Geometry & Statistics",
    subtitle: "6.G.1–6.G.4, 6.SP.1–6.SP.5",
    emoji: "📊",
    domainIds: ["geometry", "statistics"],
    duration: 40,
  },
  {
    id: "full-exam",
    title: "Full Exam — All Units Combined",
    subtitle: "6.RP, 6.NS, 6.EE, 6.G, 6.SP • All Standards",
    emoji: "🏆",
    domainIds: ["whole-numbers", "integers", "fractions", "decimals", "ratios", "measurements", "exponents", "algebra", "equations", "geometry", "statistics"],
    duration: 60,
  },
];
function pickTopicsFromUnit(domainIds: string[]): { topic: string; domain: string }[] {
  const available = domains.filter((d) => domainIds.includes(d.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picks = shuffled.slice(0, Math.min(2, shuffled.length));
  return picks.map((d) => ({
    topic: d.topics[Math.floor(Math.random() * d.topics.length)],
    domain: d.name,
  }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── PDF ────────────────────────────────────────────────────────
function generateUnitPDF(questions: ExamQuestion[], unit: typeof EXAM_UNITS[0]) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const usable = pageW - margin * 2;
  let y = 20;
  const checkPage = (n: number) => { if (y + n > 275) { doc.addPage(); y = 20; } };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(unit.title, pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${unit.subtitle} • ${questions.length} Questions • ${unit.duration} Minutes`, pageW / 2, y, { align: "center" });
  y += 6;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW / 2, y, { align: "center" });
  y += 6;
  doc.text("Name: ____________________   Date: __________", margin, y);
  y += 10;
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  questions.forEach((q, qi) => {
    checkPage(45);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const qLines = doc.splitTextToSize(`${qi + 1}. ${q.q}`, usable);
    doc.text(qLines, margin, y);
    y += qLines.length * 5 + 2;
    doc.setFont("helvetica", "normal");
    q.choices.forEach((c, ci) => {
      checkPage(6);
      const cLines = doc.splitTextToSize(`   ${letters[ci]}. ${c}`, usable - 5);
      doc.text(cLines, margin, y);
      y += cLines.length * 5;
    });
    y += 6;
  });

  // Answer key
  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Answer Key", pageW / 2, y, { align: "center" });
  y += 10;
  questions.forEach((q, qi) => {
    checkPage(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${qi + 1}. ${letters[q.answer]} — ${q.choices[q.answer]}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const exp = doc.splitTextToSize(`   ${q.exp}`, usable - 5);
    doc.text(exp, margin, y);
    y += exp.length * 5 + 4;
  });

  doc.save(`NJSLA_${unit.id}_${Date.now()}.pdf`);
  toast.success("PDF downloaded!");
}

// ── Per-unit state ─────────────────────────────────────────────
interface UnitState {
  status: "idle" | "generating" | "ready" | "in-progress" | "submitted";
  questions: ExamQuestion[];
  topics: { topic: string; domain: string }[];
  answers: (number | null)[];  // per-question user answer
  currentQ: number;
  score: number;
}

const initialUnitState = (): UnitState => ({
  status: "idle",
  questions: [],
  topics: [],
  answers: [],
  currentQ: 0,
  score: 0,
});

// ── Main Component ─────────────────────────────────────────────
export default function ModelExam() {
  const navigate = useNavigate();
  const { increment } = useUsage();

  const [units, setUnits] = useState<UnitState[]>(
    EXAM_UNITS.map(() => initialUnitState())
  );
  const [activeUnit, setActiveUnit] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(2400);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback((seconds: number) => {
    clearTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  // Auto-submit when timer expires
  useEffect(() => {
    if (timeLeft === 0 && activeUnit !== null && units[activeUnit].status === "in-progress") {
      handleSubmitUnit(activeUnit);
    }
  }, [timeLeft, activeUnit]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const updateUnit = (idx: number, patch: Partial<UnitState>) => {
    setUnits((prev) => prev.map((u, i) => i === idx ? { ...u, ...patch } : u));
  };

  // ── Generate questions for a single unit ──────────────
  const generateUnit = useCallback(async (unitIdx: number) => {
    const unit = EXAM_UNITS[unitIdx];
    const picks = pickTopicsFromUnit(unit.domainIds);
    updateUnit(unitIdx, { status: "generating", topics: picks, questions: [], answers: [], currentQ: 0, score: 0 });

    try {
      const allQs: ExamQuestion[] = [];
      let totalInput = 0, totalOutput = 0;

      for (const pick of picks) {
        const result = await generateQuestions(pick.topic, pick.domain);
        const tagged: ExamQuestion[] = result.questions.map((q) => ({
          ...q, topic: pick.topic, domain: pick.domain, unitIndex: unitIdx,
        }));
        allQs.push(...tagged);
        totalInput += result.token_usage.input_tokens;
        totalOutput += result.token_usage.output_tokens;
      }

      // Shuffle and take 20
      const shuffled = [...allQs].sort(() => Math.random() - 0.5).slice(0, 20);
      updateUnit(unitIdx, {
        status: "ready",
        questions: shuffled,
        answers: new Array(shuffled.length).fill(null),
      });
      increment("questions_generated", shuffled.length);
      increment("input_tokens", totalInput);
      increment("output_tokens", totalOutput);
      toast.success(`${unit.emoji} ${unit.title}: ${shuffled.length} questions ready!`);

      // Auto-download PDF with questions, answer key, and explanations
      generateUnitPDF(shuffled, unit);
      increment("pdfs_downloaded", 1);
    } catch (e: any) {
      updateUnit(unitIdx, { status: "idle" });
      toast.error(e.message || "Failed to generate questions");
    }
  }, [increment]);

  // ── Start quiz for a unit ─────────────────────────────
  const startQuiz = (unitIdx: number) => {
    updateUnit(unitIdx, { status: "in-progress", currentQ: 0 });
    setActiveUnit(unitIdx);
    setSelectedAnswer(null);
    setReviewMode(false);
    startTimer(EXAM_UNITS[unitIdx].duration * 60);
    increment("quizzes_taken", 1);
  };

  // ── Select answer ─────────────────────────────────────
  const handleSelect = (choiceIdx: number) => {
    if (activeUnit === null || selectedAnswer !== null) return;
    const u = units[activeUnit];
    const q = u.questions[u.currentQ];
    setSelectedAnswer(choiceIdx);

    const newAnswers = [...u.answers];
    newAnswers[u.currentQ] = choiceIdx;
    const newScore = choiceIdx === q.answer ? u.score + 1 : u.score;
    updateUnit(activeUnit, { answers: newAnswers, score: newScore });
  };

  // ── Next question ─────────────────────────────────────
  const handleNext = () => {
    if (activeUnit === null) return;
    const u = units[activeUnit];
    if (u.currentQ >= u.questions.length - 1) {
      // Last question — submit
      handleSubmitUnit(activeUnit);
      return;
    }
    updateUnit(activeUnit, { currentQ: u.currentQ + 1 });
    setSelectedAnswer(null);
  };

  const handlePrev = () => {
    if (activeUnit === null) return;
    const u = units[activeUnit];
    if (u.currentQ > 0) {
      updateUnit(activeUnit, { currentQ: u.currentQ - 1 });
      setSelectedAnswer(u.answers[u.currentQ - 1]);
    }
  };

  // ── Submit unit ───────────────────────────────────────
  const handleSubmitUnit = (unitIdx: number) => {
    clearTimer();
    updateUnit(unitIdx, { status: "submitted" });
    setActiveUnit(null);
    setSelectedAnswer(null);
    toast.success(`${EXAM_UNITS[unitIdx].title} completed!`);
  };

  // ── Review answers ────────────────────────────────────
  const startReview = (unitIdx: number) => {
    setActiveUnit(unitIdx);
    updateUnit(unitIdx, { currentQ: 0 });
    setReviewMode(true);
    setSelectedAnswer(units[unitIdx].answers[0]);
  };

  const allSubmitted = units.every((u) => u.status === "submitted");
  const totalScore = units.reduce((s, u) => s + u.score, 0);
  const totalQuestions = units.reduce((s, u) => s + u.questions.length, 0);

  // ═══════════════════════════════════════════════════════
  // ACTIVE QUIZ / REVIEW VIEW
  // ═══════════════════════════════════════════════════════
  if (activeUnit !== null) {
    const u = units[activeUnit];
    const unit = EXAM_UNITS[activeUnit];
    const q = u.questions[u.currentQ];
    const isAnswered = selectedAnswer !== null;
    const isCorrect = selectedAnswer === q?.answer;
    const isWarning = !reviewMode && timeLeft <= 300;
    const isLast = u.currentQ === u.questions.length - 1;

    return (
      <div className="min-h-screen bg-background">
        {/* Exit confirmation dialog */}
        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current progress will be submitted and scored. Are you sure you want to exit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                clearTimer();
                handleSubmitUnit(activeUnit!);
              }}>
                Exit & Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b px-3 sm:px-4 py-2 sm:py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={() => {
                    if (!reviewMode) {
                      setShowExitDialog(true);
                    } else {
                      setActiveUnit(null);
                      setReviewMode(false);
                    }
                  }}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{unit.emoji} {unit.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Q {u.currentQ + 1}/{u.questions.length}
                    {reviewMode && " • Review"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {!reviewMode && (
                  <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold ${
                    isWarning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
                  }`}>
                    <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {formatTime(timeLeft)}
                  </div>
                )}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-bold">
                  <Target className="w-3 h-3" />
                  {u.score}/{u.currentQ + (isAnswered ? 1 : 0)}
                </div>
              </div>
            </div>
            <Progress value={((u.currentQ + 1) / u.questions.length) * 100} className="h-1 sm:h-1.5 mt-2" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {q && (
            <AnimatePresence mode="wait">
              <motion.div
                key={u.currentQ}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Question */}
                <div className="bg-card border rounded-xl p-4 sm:p-5 border-l-4 border-l-primary">
                  <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                    {u.currentQ + 1}. {q.q}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                    <span className="text-[9px] sm:text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q.domain}</span>
                    <span className="text-[9px] sm:text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{q.topic}</span>
                  </div>
                </div>

                {/* Choices */}
                <div className="space-y-2 sm:space-y-3">
                  {q.choices.map((choice, ci) => {
                    let styles = "border-border bg-card hover:border-primary/40";
                    if (isAnswered || reviewMode) {
                      if (ci === q.answer) {
                        styles = "border-green-500 bg-green-500/10";
                      } else if (ci === selectedAnswer && ci !== q.answer) {
                        styles = "border-destructive bg-destructive/10";
                      } else {
                        styles = "border-border bg-card opacity-60";
                      }
                    } else if (ci === selectedAnswer) {
                      styles = "border-primary bg-primary/5 ring-1 ring-primary/20";
                    }

                    return (
                      <button
                        key={ci}
                        onClick={() => !reviewMode && handleSelect(ci)}
                        disabled={isAnswered || reviewMode}
                        className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${styles}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold shrink-0 ${
                            isAnswered && ci === q.answer
                              ? "bg-green-500 text-white"
                              : isAnswered && ci === selectedAnswer
                              ? "bg-destructive text-white"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {isAnswered && ci === q.answer ? (
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : isAnswered && ci === selectedAnswer ? (
                              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              letters[ci]
                            )}
                          </span>
                          <span className="text-xs sm:text-sm text-foreground">{choice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {(isAnswered || reviewMode) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border ${
                      (selectedAnswer === q.answer || reviewMode)
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-destructive/5 border-destructive/20"
                    }`}
                  >
                    {!reviewMode && selectedAnswer !== q.answer && (
                      <p className="text-sm font-semibold text-destructive mb-1">
                        ✗ Incorrect — The correct answer is {letters[q.answer]}.
                      </p>
                    )}
                    {!reviewMode && selectedAnswer === q.answer && (
                      <p className="text-sm font-semibold text-green-600 mb-1">✓ Correct!</p>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">{q.exp}</p>
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" disabled={u.currentQ === 0} onClick={() => {
                    if (reviewMode) {
                      const prevIdx = u.currentQ - 1;
                      updateUnit(activeUnit, { currentQ: prevIdx });
                      setSelectedAnswer(u.answers[prevIdx]);
                    } else {
                      handlePrev();
                    }
                  }}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>

                  {/* Question dots */}
                  <div className="flex gap-1 flex-wrap justify-center max-w-[180px]">
                    {u.questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          updateUnit(activeUnit, { currentQ: i });
                          setSelectedAnswer(u.answers[i]);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i === u.currentQ
                            ? "bg-primary scale-125"
                            : u.answers[i] !== null
                            ? reviewMode
                              ? u.answers[i] === u.questions[i].answer ? "bg-green-500" : "bg-destructive"
                              : "bg-primary/40"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>

                  {reviewMode ? (
                    isLast ? (
                      <Button onClick={() => { setActiveUnit(null); setReviewMode(false); }}>
                        Done
                      </Button>
                    ) : (
                      <Button onClick={() => {
                        const nextIdx = u.currentQ + 1;
                        updateUnit(activeUnit, { currentQ: nextIdx });
                        setSelectedAnswer(u.answers[nextIdx]);
                      }}>
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )
                  ) : (
                    isAnswered ? (
                      <Button onClick={handleNext}>
                        {isLast ? "Finish" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        Select an answer
                      </Button>
                    )
                  )}
                </div>

                {/* Unanswered count on last question */}
                {!reviewMode && isLast && isAnswered && (() => {
                  const unanswered = u.answers.filter((a) => a === null).length;
                  return unanswered > 0 ? (
                    <p className="text-center text-xs text-destructive flex items-center justify-center gap-1 mt-2">
                      <AlertTriangle className="w-3 h-3" />
                      {unanswered} question{unanswered > 1 ? "s" : ""} were unanswered
                    </p>
                  ) : null;
                })()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // MAIN VIEW — Unit cards with quiz buttons
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Model NJSLA Exam</h1>
            <p className="text-muted-foreground text-sm">
              3 Units + Full Exam • NJSLA Standards
            </p>
          </div>
        </div>

        {/* Overall summary if all done */}
        {allSubmitted && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6">
            <div className="bg-card border-2 border-primary/30 rounded-xl p-4 sm:p-6 text-center">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-2" />
              <h2 className="font-bold text-lg sm:text-xl text-foreground mb-1">Exam Complete!</h2>
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                {totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0}%
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                {totalScore} of {totalQuestions} correct
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {EXAM_UNITS.map((unit, i) => {
                  const u = units[i];
                  const pct = u.questions.length > 0 ? Math.round((u.score / u.questions.length) * 100) : 0;
                  return (
                    <div key={unit.id} className="bg-muted/50 rounded-lg p-2 sm:p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{unit.emoji} {unit.id === "full-exam" ? "Full" : `U${i + 1}`}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{pct}%</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{u.score}/{u.questions.length}</p>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setUnits(EXAM_UNITS.map(() => initialUnitState()))}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Start New Exam
              </Button>
            </div>
          </motion.div>
        )}

        {/* Unit cards */}
        <div className="space-y-3 sm:space-y-4">
          {EXAM_UNITS.map((unit, i) => {
            const u = units[i];
            const isGenerating = u.status === "generating";
            const isReady = u.status === "ready";
            const isSubmitted = u.status === "submitted";
            const pct = u.questions.length > 0 ? Math.round((u.score / u.questions.length) * 100) : 0;

            return (
              <>
                {unit.id === "full-exam" && (
                  <div className="flex items-center gap-2 sm:gap-3 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Test</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    unit.id === "full-exam" ? "border-2 " : ""
                  }${
                    isSubmitted
                      ? "bg-card border-primary/20"
                      : isReady
                      ? "bg-card border-green-500/30"
                      : unit.id === "full-exam"
                      ? "bg-card border-primary/40"
                      : "bg-card border-border"
                  }`}
                >
                <div className="p-4 sm:p-5">
                  {/* Unit header */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-2xl sm:text-3xl">{unit.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm sm:text-lg leading-tight">{unit.title}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{unit.subtitle}</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                        <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{unit.duration}m
                        </span>
                        <span className="text-[10px] sm:text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          20 Qs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Domain tags — hidden on smallest screens */}
                  <div className="hidden sm:flex flex-wrap gap-1 mb-3 sm:mb-4">
                    {domains
                      .filter((d) => unit.domainIds.includes(d.id))
                      .map((d) => (
                        <button
                          key={d.id}
                          onClick={() =>
                            navigate("/topics", {
                              state: { openDomain: d.id },
                            })
                          }
                          className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                          {d.name}
                        </button>
                      ))}
                  </div>

                  {/* Topics if generated */}
                  {u.topics.length > 0 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 flex items-start gap-1">
                      <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{u.topics.map((t) => t.topic).join(" • ")}</span>
                    </div>
                  )}

                  {/* Status-specific content */}
                  {u.status === "idle" && (
                    <Button className="w-full text-xs sm:text-sm" size="sm" onClick={() => generateUnit(i)}>
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Generate & Start
                    </Button>
                  )}

                  {isGenerating && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 sm:py-3">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-spin" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Generating...</span>
                    </div>
                  )}

                  {isReady && (
                    <div className="space-y-2">
                      <Button className="w-full text-xs sm:text-sm" size="sm" onClick={() => startQuiz(i)}>
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Start Quiz ({unit.duration}m)
                      </Button>
                      <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm" onClick={() => generateUnitPDF(u.questions, unit)}>
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Download PDF
                      </Button>
                    </div>
                  )}

                  {isSubmitted && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-xs sm:text-sm mb-1">
                            <span className="font-medium text-foreground">
                              {u.score}/{u.questions.length}
                            </span>
                            <span className={`font-bold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-destructive"}`}>
                              {pct}%
                            </span>
                          </div>
                          <Progress value={pct} className="h-1.5 sm:h-2" />
                        </div>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-8 px-2" onClick={() => startReview(i)}>
                          <Eye className="w-3 h-3 mr-1" /> Review
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-8 px-2" onClick={() => generateUnitPDF(u.questions, unit)}>
                          <Download className="w-3 h-3 mr-1" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-[10px] sm:text-xs h-8 px-2" onClick={() => generateUnit(i)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              </>
            );
          })}
        </div>

        <div className="mt-6">
          <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
