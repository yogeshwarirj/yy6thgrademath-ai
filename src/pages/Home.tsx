import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Sparkles, Brain, FileText, LogOut, BarChart3, Download,
  HelpCircle, Cpu, AlertTriangle, ChevronDown, Loader2, Lightbulb,
  Home as HomeIcon, Trophy, Star, Zap, GraduationCap, ChevronRight,
  Target, Award, TrendingUp
} from "lucide-react";
import { domains, totalTopics, domainHexMap } from "@/data/domains";
import { topicTips } from "@/data/topicTips";
import { generateAndDownloadPDF } from "@/lib/pdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";

type Tab = "home" | "quiz" | "exam" | "activity";

const TOTAL_TOKENS = 5_000_000;

function formatTokens(t: number) {
  if (t >= 1_000_000) return (t / 1_000_000).toFixed(2) + "M";
  if (t >= 1_000) return (t / 1_000).toFixed(1) + "K";
  return String(t);
}

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { usage, increment } = useUsage();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);

  const studentName = user?.user_metadata?.student_name || user?.email?.split("@")[0] || "Student";

  const handleDownloadPDF = async (topic: string, domain: string) => {
    setLoadingTopic(topic);
    try {
      const tokenUsage = await generateAndDownloadPDF(topic, domain);
      increment("pdfs_downloaded", 1);
      increment("questions_generated", 20);
      increment("input_tokens", tokenUsage.input_tokens);
      increment("output_tokens", tokenUsage.output_tokens);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate PDF");
    } finally {
      setLoadingTopic(null);
    }
  };

  const usedTokens = usage ? usage.input_tokens + usage.output_tokens : 0;
  const remainingTokens = Math.max(0, TOTAL_TOKENS - usedTokens);
  const usagePercent = Math.min(100, (usedTokens / TOTAL_TOKENS) * 100);
  const isExhausted = remainingTokens === 0;
  const warned90 = useRef(false);

  useEffect(() => {
    if (usagePercent >= 90 && !isExhausted && !warned90.current) {
      warned90.current = true;
      toast.warning("⚠️ You've used over 90% of your token limit. Only " + (100 - usagePercent).toFixed(1) + "% available.", {
        duration: 8000,
      });
    }
  }, [usagePercent, isExhausted]);

  const tabs: { id: Tab; label: string; icon: typeof HomeIcon; emoji: string }[] = [
    { id: "home", label: "Home", icon: HomeIcon, emoji: "🏠" },
    { id: "quiz", label: "Quiz", icon: Brain, emoji: "🧠" },
    { id: "exam", label: "Exam", icon: Trophy, emoji: "📝" },
    { id: "activity", label: "Activity", icon: BarChart3, emoji: "📊" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ═══════════════ TOP NAVBAR ═══════════════ */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <h1 className="text-sm sm:text-base font-display font-bold text-foreground">NJSLA Grade 6</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Math Practice</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {user?.email === "rj.yogeshwari@gmail.com" && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
                  <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline text-xs">Admin</span>
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                <span className="truncate max-w-[120px]">{studentName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5 text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" /> <span className="hidden sm:inline text-xs">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ TAB BAR ═══════════════ */}
      <div className="sticky top-14 sm:top-16 z-30 bg-background border-b">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-base sm:text-lg">{tab.emoji}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        <AnimatePresence mode="wait">
          {/* ─────────── HOME TAB ─────────── */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Welcome Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 sm:p-8 mb-5 sm:mb-8 text-primary-foreground">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/5" />
                <div className="relative">
                  <p className="text-sm sm:text-base opacity-90 mb-1">Welcome back! 👋</p>
                  <h2 className="text-xl sm:text-3xl font-display font-bold mb-2">
                    Hey, {studentName}!
                  </h2>
                  <p className="text-sm sm:text-base opacity-80 max-w-md">
                    Ready to practice? Pick a topic and start solving AI-generated problems. 🚀
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 text-foreground"
                      onClick={() => setActiveTab("quiz")}
                    >
                      <Zap className="w-3.5 h-3.5" /> Start Quiz
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 text-foreground"
                      onClick={() => navigate("/model-exam")}
                    >
                      <FileText className="w-3.5 h-3.5" /> Model Exam
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-8">
                {[
                  { icon: BookOpen, label: "Domains", value: "11", color: "#3B82F6", emoji: "📚" },
                  { icon: Sparkles, label: "Topics", value: String(totalTopics), color: "#8B5CF6", emoji: "✨" },
                  { icon: Target, label: "Questions", value: "∞", color: "#10B981", emoji: "🎯" },
                  { icon: Brain, label: "AI Powered", value: "✓", color: "#EC4899", emoji: "🤖" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                    className={`bg-card border rounded-xl p-3 sm:p-4 text-center hover:shadow-md transition-shadow group ${["Domains", "Topics", "Questions"].includes(s.label) ? "cursor-pointer" : "cursor-default"}`}
                    onClick={
                      s.label === "Domains" ? () => {
                        const el = document.getElementById("popular-domains");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }
                      : ["Topics", "Questions"].includes(s.label) ? () => setActiveTab("quiz")
                      : undefined
                    }
                  >
                    <span className="text-xl sm:text-2xl block mb-1">{s.emoji}</span>
                    <div className="text-lg sm:text-2xl font-bold font-display text-foreground">{s.value}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Token Meter (compact) */}
              {usage && (
                <div className="bg-card border rounded-xl p-3 sm:p-4 mb-5 sm:mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-primary" /> Token Balance
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {(100 - usagePercent).toFixed(1)}% available
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        isExhausted ? "bg-destructive" : usagePercent >= 80 ? "bg-yellow-500" : "bg-primary"
                      }`}
                    />
                  </div>
                  {isExhausted && (
                    <p className="mt-2 text-[10px] sm:text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Account deactivated. Contact <strong>rj.yogeshwari@gmail.com</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Featured Domains - Quick Access */}
              <h3 id="popular-domains" className="text-sm sm:text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2 scroll-mt-36">
                <Star className="w-4 h-4 text-primary" /> Popular Domains
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6">
                {domains.slice(0, 6).map((d, i) => {
                  const hex = domainHexMap[d.colorKey];
                  return (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * i }}
                      onClick={() => { setActiveTab("quiz"); setExpandedDomain(d.id); }}
                      className="bg-card border rounded-xl p-3 sm:p-4 text-left hover:shadow-md transition-all group"
                    >
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: hex + "18" }}
                      >
                        <d.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: hex }} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-tight mb-0.5">{d.name}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{d.topics.length} topics</p>
                      <div className="flex items-center gap-0.5 mt-1.5 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Start <ChevronRight className="w-3 h-3" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="text-center">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("quiz")} className="gap-1.5">
                  View all {domains.length} domains <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─────────── QUIZ TAB ─────────── */}
          {activeTab === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-xl font-display font-bold text-foreground flex items-center gap-2">
                  🧠 Choose a Topic
                </h2>
                <Button size="sm" variant="outline" onClick={() => navigate("/model-exam")} className="gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" /> Model Exam
                </Button>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {domains.map((d, i) => {
                  const hex = domainHexMap[d.colorKey];
                  const isExpanded = expandedDomain === d.id;
                  return (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                      className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <button
                        className="w-full p-3 sm:p-4 text-left flex items-center gap-3"
                        onClick={() => setExpandedDomain(isExpanded ? null : d.id)}
                      >
                        <div
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: hex + "15" }}
                        >
                          <d.icon className="w-5 h-5" style={{ color: hex }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-semibold text-foreground text-sm sm:text-base">{d.name}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{d.topics.length} topics</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-1.5">
                              {d.topics.map((topic) => {
                                const tips = topicTips[topic];
                                return (
                                  <div key={topic} className="rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                                    <div className="flex items-center justify-between p-2.5 sm:p-3 gap-2">
                                      <span className="text-xs sm:text-sm font-medium text-foreground leading-tight flex-1">{topic}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                                          disabled={loadingTopic === topic}
                                          onClick={() => handleDownloadPDF(topic, d.name)}
                                          title="Download PDF"
                                        >
                                          {loadingTopic === topic ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Download className="w-3.5 h-3.5" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-8 text-xs px-3 gap-1"
                                          onClick={() =>
                                            navigate("/quiz", {
                                              state: { topics: [topic], domain: d.name, domainKey: d.colorKey },
                                            })
                                          }
                                        >
                                          <Zap className="w-3 h-3" /> Quiz
                                        </Button>
                                      </div>
                                    </div>
                                    {tips && (
                                      <div className="px-3 pb-2.5">
                                        <div className="bg-primary/5 rounded-lg p-2 sm:p-2.5">
                                          <div className="flex items-start gap-1.5 text-[10px] sm:text-xs text-primary mb-1">
                                            <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span className="font-medium">{tips.tip}</span>
                                          </div>
                                          <ul className="ml-5 space-y-0.5">
                                            {tips.points.map((pt, idx) => (
                                              <li key={idx} className="text-[9px] sm:text-[11px] text-muted-foreground list-disc">{pt}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─────────── EXAM TAB ─────────── */}
          {activeTab === "exam" && (
            <motion.div
              key="exam"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-card border rounded-xl p-5 sm:p-8 text-center space-y-4">
                <span className="text-4xl sm:text-5xl block">📝</span>
                <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Model NJSLA Exam</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Take a full practice exam modeled after the official NJSLA Grade 6 Math test. 
                  3 timed units covering all standards — Ratios, Expressions, Geometry & Statistics.
                </p>
                <Button
                  size="lg"
                  className="gap-2 mt-2"
                  onClick={() => navigate("/model-exam")}
                >
                  <GraduationCap className="w-5 h-5" />
                  Start Model Exam
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─────────── ACTIVITY TAB ─────────── */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-base sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                📊 Your Progress
              </h2>

              {usage ? (
                <div className="space-y-4">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                    {[
                      { icon: HelpCircle, label: "Questions Generated", value: usage.questions_generated, emoji: "❓", color: "#3B82F6" },
                      { icon: Trophy, label: "Quizzes Taken", value: usage.quizzes_taken, emoji: "🏆", color: "#10B981" },
                      { icon: Download, label: "PDFs Downloaded", value: usage.pdfs_downloaded, emoji: "📄", color: "#8B5CF6" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="bg-card border rounded-xl p-3 sm:p-5 text-center"
                      >
                        <span className="text-2xl sm:text-3xl block mb-1.5">{stat.emoji}</span>
                        <div className="text-2xl sm:text-4xl font-bold font-display text-foreground mb-0.5">{stat.value}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Token Usage Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border rounded-xl p-4 sm:p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm sm:text-base font-display font-semibold text-foreground flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" /> Token Usage
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isExhausted
                          ? "bg-destructive/10 text-destructive"
                          : usagePercent >= 80
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-success/10 text-success"
                      }`}>
                        {isExhausted ? "Exhausted" : usagePercent >= 80 ? "Running Low" : "Active"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div className="text-center p-2.5 rounded-lg bg-secondary/50">
                        <div className="text-xs sm:text-sm font-bold text-foreground">{formatTokens(TOTAL_TOKENS)}</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-secondary/50">
                        <div className="text-xs sm:text-sm font-bold text-foreground">{formatTokens(usedTokens)}</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground">Used</div>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-primary/5">
                        <div className="text-xs sm:text-sm font-bold text-primary">{(100 - usagePercent).toFixed(1)}%</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground">Available</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-3 sm:h-4 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${usagePercent}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isExhausted ? "bg-destructive" : usagePercent >= 80 ? "bg-yellow-500" : "bg-primary"
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground">
                        <span>{usagePercent.toFixed(1)}% used</span>
                      </div>
                      <div className="bg-secondary/40 rounded-xl py-2 text-center">
                        <span className="text-base sm:text-lg font-bold text-muted-foreground">
                          {(100 - usagePercent).toFixed(1)}% <span className="font-medium text-sm">available</span>
                        </span>
                      </div>
                    </div>

                    {isExhausted ? (
                      <div className="mt-4 flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-3 py-2.5 text-xs sm:text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Tokens exhausted — account deactivated.<br />
                          Contact <strong>rj.yogeshwari@gmail.com</strong> to reactivate.
                        </span>
                      </div>
                    ) : usagePercent >= 80 ? (
                      <div className="mt-4 flex items-start gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg px-3 py-2.5 text-xs sm:text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Running low on tokens. When exhausted, your account will be deactivated.<br />
                          Contact <strong>rj.yogeshwari@gmail.com</strong> for assistance.
                        </span>
                      </div>
                    ) : null}
                  </motion.div>

                  {/* Info note */}
                  <div className="bg-secondary/50 rounded-xl p-3 sm:p-4 text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-base">ℹ️</span>
                    <span>
                      Each quiz or model exam uses AI resources (tokens). If your tokens are fully used, 
                      your account will be deactivated. Please contact <strong>rj.yogeshwari@gmail.com</strong> to reactivate.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">Loading your stats…</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════ BOTTOM STATUS BAR ═══════════════ */}
      {usage && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 px-3 py-1.5 text-center text-[10px] sm:text-xs font-medium border-t ${
          isExhausted
            ? "bg-destructive text-destructive-foreground"
            : "bg-card/80 backdrop-blur-sm text-muted-foreground"
        }`}>
          {isExhausted ? (
            <><AlertTriangle className="w-3 h-3 inline mr-1" /> Account deactivated — contact rj.yogeshwari@gmail.com</>
          ) : (
          <><Cpu className="w-3 h-3 inline mr-1" /> {(100 - usagePercent).toFixed(1)}% available</>
          )}
          <div className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground">
            For any support or facing challenges pls email to rj.yogeshwari@gmail.com
          </div>
        </div>
      )}
    </div>
  );
}
