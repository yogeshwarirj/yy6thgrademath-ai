import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { domains, domainHexMap } from "@/data/domains";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateAndDownloadPDF } from "@/lib/pdf";
import { toast } from "sonner";
import { useUsage } from "@/hooks/useUsage";

export default function Topics() {
  const navigate = useNavigate();
  const location = useLocation();
  const openDomain = (location.state as any)?.openDomain;
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const { increment } = useUsage();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Button>

          <h1 className="text-3xl font-display font-bold text-foreground mb-6">All Topics</h1>

          <Accordion type="multiple" defaultValue={openDomain ? [openDomain] : []} className="space-y-3">
            {domains.map((d) => {
              const hex = domainHexMap[d.colorKey];
              return (
                <AccordionItem
                  key={d.id}
                  value={d.id}
                  className="bg-card border rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: hex + "18" }}
                      >
                        <d.icon className="w-4 h-4" style={{ color: hex }} />
                      </div>
                      <div className="text-left">
                        <span className="font-display font-semibold text-foreground">{d.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({d.topics.length})</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="flex justify-end mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const randomTopic = d.topics[Math.floor(Math.random() * d.topics.length)];
                          navigate("/quiz", {
                            state: { topics: [randomTopic], domain: d.name, domainKey: d.colorKey },
                          });
                        }}
                      >
                        Domain Quiz
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {d.topics.map((topic) => (
                        <div
                          key={topic}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors gap-2"
                        >
                          <span className="text-sm font-medium text-foreground">{topic}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-primary h-8 px-2"
                              disabled={loadingTopic === topic}
                              onClick={() => handleDownloadPDF(topic, d.name)}
                            >
                              {loadingTopic === topic ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              <span className="text-xs ml-1">PDF</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary text-sm h-8 px-2"
                              onClick={() =>
                                navigate("/quiz", {
                                  state: { topics: [topic], domain: d.name, domainKey: d.colorKey },
                                })
                              }
                            >
                              Start Quiz →
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}
