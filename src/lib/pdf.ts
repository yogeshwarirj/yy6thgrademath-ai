import jsPDF from "jspdf";
import { toast } from "sonner";
import { generateQuestions, type Question } from "@/lib/api";

const pdfLetters = ["A", "B", "C", "D"] as const;

export function generateWorksheetPDF(
  questions: (Question & { topic: string })[],
  domain: string,
  topics: string[]
) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const usable = pageW - margin * 2;
  let y = 20;

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
  doc.text(`${domain} — ${questions.length} Questions`, pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.text(`Topics: ${topics.join(", ")}`, pageW / 2, y, { align: "center" });
  y += 10;
  doc.text("Name: _______________________   Date: _______________", margin, y);
  y += 12;

  let qNum = 1;
  for (const topic of topics) {
    const topicQs = questions.filter((q) => q.topic === topic);
    if (topicQs.length === 0) continue;

    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(topic, margin, y);
    y += 8;

    topicQs.forEach((q) => {
      checkPage(40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(`${qNum}. ${q.q}`, usable);
      doc.text(qLines, margin, y);
      y += qLines.length * 5 + 2;

      doc.setFont("helvetica", "normal");
      q.choices.forEach((c, ci) => {
        checkPage(6);
        const cLines = doc.splitTextToSize(`   ${pdfLetters[ci]}. ${c}`, usable - 5);
        doc.text(cLines, margin, y);
        y += cLines.length * 5;
      });
      y += 5;
      qNum++;
    });
  }

  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Answer Key", pageW / 2, y, { align: "center" });
  y += 10;

  qNum = 1;
  for (const topic of topics) {
    const topicQs = questions.filter((q) => q.topic === topic);
    if (topicQs.length === 0) continue;

    checkPage(14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(topic, margin, y);
    y += 7;

    topicQs.forEach((q) => {
      checkPage(25);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${qNum}. ${pdfLetters[q.answer]} — ${q.choices[q.answer]}`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const expLines = doc.splitTextToSize(`   ${q.exp}`, usable - 5);
      doc.text(expLines, margin, y);
      y += expLines.length * 5 + 4;
      qNum++;
    });
  }

  const topicSlug = topics.join("_").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`NJSLA_Grade_6_${topicSlug}.pdf`);
  toast.success("Worksheet PDF downloaded!");
}

export async function generateAndDownloadPDF(
  topic: string,
  domain: string
): Promise<{ input_tokens: number; output_tokens: number }> {
  const result = await generateQuestions(topic, domain);
  const tagged = result.questions.map((q) => ({ ...q, topic }));
  generateWorksheetPDF(tagged, domain, [topic]);
  return result.token_usage;
}
