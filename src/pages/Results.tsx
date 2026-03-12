import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainHexMap } from "@/data/domains";
import { toast } from "sonner";
import type { Question } from "@/lib/api";
import jsPDF from "jspdf";

interface ResultsState {
  score: number;
  total: number;
  domain: string;
  domainKey: string;
  topics: string[];
  questions: (Question & { topic: string })[];
  userAnswers: (number | null)[];
}

const letters = ["A", "B", "C", "D"];

function getMedal(pct: number) {
  if (pct >= 90) return "🏆";
  if (pct >= 75) return "🌟";
  if (pct >= 60) return "👍";
  return "📚";
}

function CircularProgress({ pct, hex }: { pct: number; hex: string }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
      <motion.circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={hex}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="85" textAnchor="middle" className="font-display" fontSize="32" fontWeight="700" fill="currentColor">
        {Math.round(pct)}%
      </text>
      <text x="90" y="110" textAnchor="middle" fontSize="14" fill="hsl(var(--muted-foreground))">
        correct
      </text>
    </svg>
  );
}

function generatePDF(state: ResultsState, filterTopic?: string) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const usable = pageW - margin * 2;
  let y = 20;

  const questions = filterTopic
    ? state.questions.filter((q) => q.topic === filterTopic)
    : state.questions;

  const title = filterTopic || state.domain;
  const score = questions.reduce((s, q) => {
    const globalIdx = state.questions.indexOf(q);
    return s + (state.userAnswers[globalIdx] === q.answer ? 1 : 0);
  }, 0);

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NJSLA Grade 6 Math Practice", pageW / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${title} — Score: ${score}/${questions.length}`, pageW / 2, y, { align: "center" });
  y += 12;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Questions", margin, y);
  y += 8;

  questions.forEach((q, i) => {
    checkPage(40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const qLines = doc.splitTextToSize(`${i + 1}. ${q.q}`, usable);
    doc.text(qLines, margin, y);
    y += qLines.length * 5 + 2;

    doc.setFont("helvetica", "normal");
    q.choices.forEach((c, ci) => {
      checkPage(6);
      const cLines = doc.splitTextToSize(`   ${letters[ci]}. ${c}`, usable - 5);
      doc.text(cLines, margin, y);
      y += cLines.length * 5;
    });
    y += 4;
  });

  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Answer Key", pageW / 2, y, { align: "center" });
  y += 10;

  questions.forEach((q, i) => {
    checkPage(30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${letters[q.answer]} — ${q.choices[q.answer]}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const expLines = doc.splitTextToSize(`   ${q.exp}`, usable - 5);
    doc.text(expLines, margin, y);
    y += expLines.length * 5 + 4;
  });

  doc.save(`NJSLA_${title.replace(/[^a-zA-Z0-9]/g, "_")}_Quiz.pdf`);
  toast.success("PDF downloaded!");
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | null;

  if (!state) {
    navigate("/");
    return null;
  }

  const pct = state.total > 0 ? (state.score / state.total) * 100 : 0;
  const hex = domainHexMap[state.domainKey] || "#3B82F6";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <div className="text-6xl mb-4">{getMedal(pct)}</div>
          <CircularProgress pct={pct} hex={hex} />
          <p className="mt-4 text-lg text-muted-foreground">
            You got <strong className="text-foreground">{state.score}</strong> out of <strong className="text-foreground">{state.total}</strong> correct
          </p>
        </motion.div>

        {/* Item Type Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {([1, 2, 3] as const).map((type) => {
            const label = type === 1 ? "Type I" : type === 2 ? "Type II" : "Type III";
            const desc = type === 1 ? "Recall" : type === 2 ? "Application" : "Reasoning";
            const typeQs = state.questions.filter((q) => q.type === type);
            const typeScore = typeQs.reduce((s, q) => {
              const idx = state.questions.indexOf(q);
              return s + (state.userAnswers[idx] === q.answer ? 1 : 0);
            }, 0);
            const typePct = typeQs.length > 0 ? Math.round((typeScore / typeQs.length) * 100) : 0;
            return (
              <div key={type} className="bg-card border rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-bold text-foreground">{typeScore}/{typeQs.length}</p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2 mb-1">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${typePct}%`, backgroundColor: hex }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Download PDFs */}
        <div className="space-y-2 mb-6">
          <Button variant="outline" className="w-full" onClick={() => generatePDF(state)}>
            <Download className="w-4 h-4 mr-2" /> Download All Questions PDF
          </Button>
          {state.topics.length > 1 && state.topics.map((topic) => {
            const topicQs = state.questions.filter((q) => q.topic === topic);
            const topicScore = topicQs.reduce((s, q) => {
              const idx = state.questions.indexOf(q);
              return s + (state.userAnswers[idx] === q.answer ? 1 : 0);
            }, 0);
            return (
              <Button
                key={topic}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => generatePDF(state, topic)}
              >
                <Download className="w-3 h-3 mr-2" />
                {topic} ({topicScore}/{topicQs.length})
              </Button>
            );
          })}
        </div>

        {/* Review */}
        <div className="space-y-3 mb-8">
          {state.questions.map((q, i) => {
            const userAns = state.userAnswers[i];
            const correct = userAns === q.answer;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  {correct ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">{q.q}</p>
                    {!correct && (
                      <p className="text-xs text-muted-foreground">
                        Correct: <span className="text-success font-medium">{q.choices[q.answer]}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              navigate("/quiz", {
                state: { topics: state.topics, domain: state.domain, domainKey: state.domainKey },
              })
            }
          >
            New Questions
          </Button>
          <Button className="flex-1" onClick={() => navigate("/topics")}>
            New Topic →
          </Button>
        </div>
      </div>
    </div>
  );
}
