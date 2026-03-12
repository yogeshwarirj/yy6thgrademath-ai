import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, RefreshCw, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { generateQuestions, type Question } from "@/lib/api";
import { domainHexMap } from "@/data/domains";
import { generateWorksheetPDF } from "@/lib/pdf";
import { useUsage } from "@/hooks/useUsage";

interface QuizState {
  topics: string[];
  domain: string;
  domainKey: string;
}

const letters = ["A", "B", "C", "D"];

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as QuizState | null;

  const [allQuestions, setAllQuestions] = useState<(Question & { topic: string })[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userAnswers = useRef<(number | null)[]>([]);

  const hex = state ? domainHexMap[state.domainKey] || "#3B82F6" : "#3B82F6";
  const { increment } = useUsage();

  const loadQuestions = useCallback(async () => {
    if (!state) return;
    setLoading(true);
    setError(null);
    setAllQuestions([]);
    setCurrentIdx(0);
    setScore(0);
    setSelectedAnswer(null);
    userAnswers.current = [];

    try {
      const results: (Question & { topic: string })[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      for (const topic of state.topics) {
        const result = await generateQuestions(topic, state.domain);
        results.push(...result.questions.map((q) => ({ ...q, topic })));
        totalInputTokens += result.token_usage.input_tokens;
        totalOutputTokens += result.token_usage.output_tokens;
      }
      userAnswers.current = new Array(results.length).fill(null);
      setAllQuestions(results);
      increment("questions_generated", results.length);
      increment("quizzes_taken", 1);
      increment("input_tokens", totalInputTokens);
      increment("output_tokens", totalOutputTokens);
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to generate questions", {
        description: e.message,
        action: { label: "Retry", onClick: loadQuestions },
      });
    } finally {
      setLoading(false);
    }
  }, [state]);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start/restart timer when question changes or quiz loads
  useEffect(() => {
    if (loading || error || allQuestions.length === 0) return;
    if (selectedAnswer !== null) return; // already answered
    setTimeLeft(60);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Time's up — mark as unanswered and auto-reveal
          setSelectedAnswer(-1); // -1 = timed out (no selection)
          userAnswers.current[currentIdx] = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [currentIdx, loading, error, allQuestions.length]);

  // Stop timer when answered
  useEffect(() => {
    if (selectedAnswer !== null) clearTimer();
  }, [selectedAnswer, clearTimer]);

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
    loadQuestions();
  }, []);

  if (!state) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground">Generating Questions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button onClick={loadQuestions}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const total = allQuestions.length;
  if (total === 0) return null;

  const question = allQuestions[currentIdx];
  const isAnswered = selectedAnswer !== null;
  const isLast = currentIdx === total - 1;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    userAnswers.current[currentIdx] = idx;
    if (idx === question.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      navigate("/results", {
        state: {
          score: score,
          total,
          domain: state.domain,
          domainKey: state.domainKey,
          topics: state.topics,
          questions: allQuestions,
          userAnswers: [...userAnswers.current],
        },
      });
      return;
    }
    setSelectedAnswer(null);
    setTimeLeft(60);
    setCurrentIdx((i) => i + 1);
  };

  const timedOut = selectedAnswer === -1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/topics")} className="h-8 px-2 sm:px-3">
            <X className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Exit</span>
          </Button>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 sm:px-3"
              onClick={() => { generateWorksheetPDF(allQuestions, state.domain, state.topics); increment("pdfs_downloaded", 1); }}
            >
              <Download className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">PDF</span>
            </Button>
            <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[80px] sm:max-w-none">{question.topic}</span>
          </div>
          <span className="text-sm font-bold shrink-0" style={{ color: hex }}>
            {score}/{currentIdx + (isAnswered ? 1 : 0)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Progress value={((currentIdx + 1) / total) * 100} className="h-2 flex-1" />
          <div className={`ml-2 sm:ml-3 flex items-center gap-1 text-xs sm:text-sm font-bold ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{timeLeft}s</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 sm:mb-6 text-center">
          Question {currentIdx + 1} of {total}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium text-white" style={{ backgroundColor: hex }}>
            {state.domain}
          </span>
          <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
            {question.topic}
          </span>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-card border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6"
            style={{ borderLeftWidth: 4, borderLeftColor: hex }}
          >
            <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">{question.q}</p>
          </motion.div>
        </AnimatePresence>

        {/* Choices */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {question.choices.map((choice, idx) => {
            let bg = "bg-card hover:bg-secondary/50";
            let border = "border";
            if (isAnswered) {
              if (idx === question.answer) {
                bg = "bg-success/10";
                border = "border-success";
              } else if (idx === selectedAnswer) {
                bg = "bg-destructive/10";
                border = "border-destructive";
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl text-left transition-all ${bg} ${border} ${!isAnswered ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: isAnswered && idx === question.answer ? "hsl(var(--success))" : isAnswered && idx === selectedAnswer ? "hsl(var(--destructive))" : hex + "18",
                    color: isAnswered && (idx === question.answer || idx === selectedAnswer) ? "white" : hex,
                  }}
                >
                  {letters[idx]}
                </span>
                <span className="text-sm font-medium text-foreground">{choice}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
            {timedOut && (
              <p className="text-xs sm:text-sm font-semibold text-destructive mb-2">⏰ Time's up! The correct answer was {letters[question.answer]}.</p>
            )}
            <p className="text-xs sm:text-sm font-semibold text-primary mb-1">Explanation</p>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">{question.exp}</p>
          </motion.div>
        )}

        {isAnswered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button className="w-full" size="lg" onClick={handleNext}>
              {isLast ? "See Results →" : "Next Question →"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
