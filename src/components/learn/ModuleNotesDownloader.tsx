"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { Module, ContentBlock } from "@/types/curriculum";

function formatContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case "text":
      return block.content;
    case "bullets":
      return block.items.map((item) => `• ${item}`).join("\n");
    case "callout":
      return `[${block.variant.toUpperCase()}] ${block.content}`;
    case "code":
      return `[CODE: ${block.language}]\n${block.code}`;
    case "formula":
      return `[FORMULA] ${block.expression}\n${block.explanation}`;
    case "table":
      const header = block.headers.join(" | ");
      const separator = block.headers.map(() => "---").join(" | ");
      const rows = block.rows.map((row) => row.join(" | ")).join("\n");
      return `${header}\n${separator}\n${rows}`;
    case "diagram":
      return `[DIAGRAM: ${block.kind}]\n${block.caption}`;
    case "interactive":
      return `[INTERACTIVE: ${block.component}]`;
    default:
      return "";
  }
}

interface ModuleNotesDownloaderProps {
  module: Module;
}

export function ModuleNotesDownloader({ module }: ModuleNotesDownloaderProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = 40;

      // Helper to add text with wrapping
      const addText = (
        text: string,
        fontSize: number = 11,
        fontStyle: string = "normal",
        color: [number, number, number] = [60, 60, 60],
        lineHeight: number = 1.4
      ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, contentWidth);
        const lineHeightPt = fontSize * lineHeight;

        // Check if we need a new page
        if (y + lines.length * lineHeightPt > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }

        doc.text(lines, margin, y);
        y += lines.length * lineHeightPt + fontSize * 0.5;
      };

      // Title
      addText(
        `Module ${module.number}: ${module.title}`,
        18,
        "bold",
        [25, 55, 109]
      );

      // Subtitle
      addText(module.subtitle, 12, "italic", [100, 100, 100]);

      // Meta info
      addText(
        `Difficulty: ${module.difficulty}  |  Estimated Time: ${module.estimatedHours} hours  |  Lessons: ${module.lessons.length}`,
        9,
        "normal",
        [120, 120, 120]
      );

      y += 10;

      // Horizontal line
      doc.setDrawColor(200, 170, 100);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      // Lessons
      module.lessons.forEach((lesson, lessonIndex) => {
        // Lesson title
        addText(
          `${lessonIndex + 1}. ${lesson.title}`,
          14,
          "bold",
          [25, 55, 109]
        );
        y += 5;

        // Lesson content blocks
        lesson.content.forEach((block) => {
          switch (block.type) {
            case "text":
              addText(block.content, 10, "normal", [60, 60, 60], 1.5);
              break;

            case "bullets":
              block.items.forEach((item) => {
                addText(`• ${item}`, 10, "normal", [60, 60, 60], 1.4);
              });
              y += 5;
              break;

            case "callout":
              const calloutColor: Record<string, [number, number, number]> = {
                info: [59, 130, 246],
                warning: [245, 158, 11],
                tip: [34, 197, 94],
                success: [16, 185, 129],
              };
              const cColor = calloutColor[block.variant] || [100, 100, 100];

              // Callout box background
              doc.setFillColor(cColor[0], cColor[1], cColor[2]);
              doc.setDrawColor(cColor[0], cColor[1], cColor[2]);
              doc.setLineWidth(0.5);

              const calloutLines = doc.splitTextToSize(block.content, contentWidth - 20);
              const calloutHeight = calloutLines.length * 14 + 16;

              if (y + calloutHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
              }

              doc.roundedRect(margin, y - 4, contentWidth, calloutHeight, 4, 4, "FD");
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(10);
              doc.text(calloutLines, margin + 10, y + 10);
              y += calloutHeight + 8;
              break;

            case "code":
              const codeLines = doc.splitTextToSize(block.code, contentWidth - 20);
              const codeHeight = codeLines.length * 11 + 20;

              if (y + codeHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
              }

              // Code block background
              doc.setFillColor(30, 30, 30);
              doc.roundedRect(margin, y - 4, contentWidth, codeHeight, 3, 3, "F");

              // Language label
              doc.setTextColor(150, 150, 150);
              doc.setFontSize(8);
              doc.text(block.language, margin + 8, y + 8);

              // Code text
              doc.setTextColor(220, 220, 220);
              doc.setFontSize(9);
              doc.setFont("courier", "normal");
              doc.text(codeLines, margin + 10, y + 20);
              y += codeHeight + 10;
              doc.setFont("helvetica", "normal");
              break;

            case "formula":
              doc.setFillColor(248, 249, 252);
              doc.setDrawColor(200, 200, 200);
              doc.roundedRect(margin + 10, y - 4, contentWidth - 20, 50, 3, 3, "FD");

              doc.setTextColor(25, 55, 109);
              doc.setFontSize(11);
              doc.setFont("helvetica", "bold");
              doc.text(block.expression, margin + 20, y + 14);

              doc.setTextColor(80, 80, 80);
              doc.setFontSize(9);
              doc.setFont("helvetica", "normal");
              const expLines = doc.splitTextToSize(block.explanation, contentWidth - 40);
              doc.text(expLines, margin + 20, y + 30);

              y += 55;
              break;

            case "table":
              const colCount = block.headers.length;
              const colWidth = contentWidth / colCount;
              const rowHeight = 22;

              // Header
              doc.setFillColor(25, 55, 109);
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(9);
              doc.setFont("helvetica", "bold");

              block.headers.forEach((header, i) => {
                doc.rect(margin + i * colWidth, y, colWidth, rowHeight, "F");
                doc.text(header, margin + i * colWidth + 6, y + 14);
              });
              y += rowHeight;

              // Rows
              doc.setTextColor(60, 60, 60);
              doc.setFont("helvetica", "normal");

              block.rows.forEach((row, rowIdx) => {
                if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
                  doc.addPage();
                  y = margin;
                }

                if (rowIdx % 2 === 0) {
                  doc.setFillColor(248, 249, 252);
                  doc.rect(margin, y, contentWidth, rowHeight, "F");
                }

                row.forEach((cell, i) => {
                  const cellLines = doc.splitTextToSize(cell, colWidth - 10);
                  doc.text(cellLines, margin + i * colWidth + 6, y + 14);
                });
                y += rowHeight;
              });
              y += 8;
              break;

            case "diagram":
              addText(
                `[Diagram: ${block.kind}]`,
                9,
                "italic",
                [120, 120, 120]
              );
              addText(block.caption, 9, "normal", [100, 100, 100]);
              break;

            default:
              break;
          }
        });

        y += 15;

        // Separator between lessons
        if (lessonIndex < module.lessons.length - 1) {
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(margin, y - 8, pageWidth - margin, y - 8);
        }
      });

      // Footer on each page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `System Design Academy · Module ${module.number}: ${module.title} · Page ${i} of ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: "center" }
        );
      }

      // Save
      doc.save(`SDA-Module-${module.number}-${module.title.replace(/\s+/g, "-")}-Notes.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={generatePDF}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      {loading ? "Generating..." : "Download Notes"}
    </Button>
  );
}
