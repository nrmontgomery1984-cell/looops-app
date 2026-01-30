// PDF Export Service - Generate PDF from Directional Document

import { jsPDF } from "jspdf";
import { DirectionalDocument, LoopId, ALL_LOOPS } from "../types";
import {
  IDENTITY_STATEMENTS,
  VALUE_DIMENSIONS,
  LOOP_THRIVING_OPTIONS,
  LOOP_NONNEGOTIABLES,
  LOOP_MINIMUM_STANDARDS,
  SEASON_OPTIONS,
  ENERGY_MANAGEMENT_OPTIONS,
  FINANCIAL_APPROACH_OPTIONS,
  TRADEOFF_SCENARIOS,
} from "../data/directionalOptions";

// Color palette
const COLORS = {
  navy: [26, 26, 46] as [number, number, number],
  coral: [242, 112, 89] as [number, number, number],
  sage: [119, 176, 153] as [number, number, number],
  gold: [228, 183, 99] as [number, number, number],
  text: [50, 50, 50] as [number, number, number],
  lightGray: [150, 150, 150] as [number, number, number],
  bgGray: [245, 245, 245] as [number, number, number],
};

// Loop colors for the PDF
const LOOP_PDF_COLORS: Record<LoopId, [number, number, number]> = {
  Health: [72, 187, 120],
  Wealth: [228, 183, 99],
  Family: [244, 162, 97],
  Work: [102, 126, 234],
  Fun: [237, 100, 166],
  Maintenance: [119, 176, 153],
  Meaning: [159, 122, 234],
};

// Helper functions
function getIdentityLabel(id: string): string {
  return IDENTITY_STATEMENTS.find((s) => s.id === id)?.label || id;
}

function getLoopOptionLabel(
  loopId: LoopId,
  optionId: string,
  optionsMap: Record<LoopId, { id: string; label: string }[]>
): string {
  return optionsMap[loopId]?.find((o) => o.id === optionId)?.label || optionId;
}

function getSeasonLabel(seasonId: string): string {
  return SEASON_OPTIONS.find((s) => s.id === seasonId)?.label || seasonId;
}

function getEnergyLabel(id: string): string {
  return ENERGY_MANAGEMENT_OPTIONS.find((o) => o.id === id)?.label || id;
}

function getFinancialLabel(id: string): string {
  return FINANCIAL_APPROACH_OPTIONS.find((o) => o.id === id)?.label || id;
}

// Main export function
export async function exportDirectionalDocumentPDF(
  doc: DirectionalDocument,
  userName: string = "User"
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add new page if needed
  const checkNewPage = (neededHeight: number = 30) => {
    if (y + neededHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper to draw section header
  const drawSectionHeader = (title: string, color: [number, number, number] = COLORS.coral) => {
    checkNewPage(25);
    pdf.setFillColor(...color);
    pdf.rect(margin, y, contentWidth, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(title.toUpperCase(), margin + 4, y + 5.5);
    y += 12;
    pdf.setTextColor(...COLORS.text);
  };

  // Helper to draw subsection title
  const drawSubsectionTitle = (title: string) => {
    checkNewPage(15);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.navy);
    pdf.text(title, margin, y);
    y += 6;
    pdf.setTextColor(...COLORS.text);
  };

  // Helper to draw text
  const drawText = (text: string, indent: number = 0, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      checkNewPage(6);
      pdf.text(line, margin + indent, y);
      y += 5;
    }
  };

  // Helper to draw bullet list
  const drawBulletList = (items: string[], indent: number = 4) => {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    for (const item of items) {
      const lines = pdf.splitTextToSize(item, contentWidth - indent - 6);
      for (let i = 0; i < lines.length; i++) {
        checkNewPage(5);
        if (i === 0) {
          pdf.text("•", margin + indent, y);
        }
        pdf.text(lines[i], margin + indent + 6, y);
        y += 5;
      }
    }
  };

  // ===== TITLE PAGE =====
  pdf.setFillColor(...COLORS.navy);
  pdf.rect(0, 0, pageWidth, 80, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("MY DIRECTIONS", pageWidth / 2, 35, { align: "center" });

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Personal Direction Document for ${userName}`, pageWidth / 2, 50, { align: "center" });

  pdf.setFontSize(10);
  pdf.text(
    `Created: ${new Date(doc.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageWidth / 2,
    65,
    { align: "center" }
  );

  // Looops branding
  y = 90;
  pdf.setTextColor(...COLORS.coral);
  pdf.setFontSize(12);
  pdf.text("LOOOPS", pageWidth / 2, y, { align: "center" });
  y += 8;
  pdf.setTextColor(...COLORS.lightGray);
  pdf.setFontSize(9);
  pdf.text("Life Operating System", pageWidth / 2, y, { align: "center" });

  // Start content on new page
  pdf.addPage();
  y = margin;

  // ===== CORE DIRECTIONS =====
  drawSectionHeader("Core Directions");

  // Identity
  drawSubsectionTitle("Who I Want To Be");
  const identityLabels = doc.core.identityStatements.map((id) => getIdentityLabel(id));
  drawBulletList(identityLabels);
  y += 4;

  // Values
  drawSubsectionTitle("My Values");
  y += 2;
  for (const dim of VALUE_DIMENSIONS) {
    checkNewPage(8);
    const value = doc.core.valueSliders[dim.id];
    const position = ((value - 1) / 9) * 100;

    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.lightGray);
    pdf.text(dim.leftPole, margin, y);
    pdf.text(dim.rightPole, margin + contentWidth, y, { align: "right" });

    // Draw slider track
    const trackY = y + 3;
    const trackWidth = contentWidth * 0.6;
    const trackX = margin + (contentWidth - trackWidth) / 2;

    pdf.setFillColor(...COLORS.bgGray);
    pdf.roundedRect(trackX, trackY, trackWidth, 3, 1.5, 1.5, "F");

    // Draw marker
    const markerX = trackX + (position / 100) * trackWidth;
    pdf.setFillColor(...COLORS.coral);
    pdf.circle(markerX, trackY + 1.5, 2.5, "F");

    y += 12;
  }
  y += 4;

  // Loop Priorities
  checkNewPage(50);
  drawSubsectionTitle("Loop Priorities");
  y += 2;
  const ranking = doc.core.tradeoffPriorities.loopPriorityRanking;
  for (let i = 0; i < ranking.length; i++) {
    const loopId = ranking[i];
    const color = LOOP_PDF_COLORS[loopId];

    pdf.setFillColor(...color);
    pdf.circle(margin + 4, y - 1, 3, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...COLORS.navy);
    pdf.text(`${i + 1}.`, margin + 10, y);
    pdf.setTextColor(...color);
    pdf.text(loopId, margin + 18, y);

    y += 7;
  }
  y += 4;

  // Resource Philosophy
  checkNewPage(30);
  drawSubsectionTitle("Resource Philosophy");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.text);
  pdf.text(`Energy Style: ${getEnergyLabel(doc.core.resourcePhilosophy.energyManagement)}`, margin + 4, y);
  y += 6;
  pdf.text(`Financial Approach: ${getFinancialLabel(doc.core.resourcePhilosophy.financialApproach)}`, margin + 4, y);
  y += 8;

  // Time Allocation
  drawSubsectionTitle("Ideal Time Allocation");
  y += 2;
  for (const loopId of ALL_LOOPS) {
    checkNewPage(8);
    const allocation = doc.core.resourcePhilosophy.timeAllocation[loopId] || 0;
    const color = LOOP_PDF_COLORS[loopId];

    pdf.setFontSize(9);
    pdf.setTextColor(...color);
    pdf.setFont("helvetica", "bold");
    pdf.text(loopId, margin, y);

    // Draw bar
    const barX = margin + 30;
    const barWidth = contentWidth - 50;
    const filledWidth = (allocation / 50) * barWidth;

    pdf.setFillColor(...COLORS.bgGray);
    pdf.roundedRect(barX, y - 3, barWidth, 4, 2, 2, "F");
    pdf.setFillColor(...color);
    pdf.roundedRect(barX, y - 3, filledWidth, 4, 2, 2, "F");

    pdf.setTextColor(...COLORS.text);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${allocation}%`, margin + contentWidth - 15, y);

    y += 7;
  }
  y += 6;

  // Tradeoff Decisions
  if (doc.core.tradeoffPriorities.conflictResolutions.length > 0) {
    checkNewPage(40);
    drawSubsectionTitle("Tradeoff Decisions");
    y += 2;
    for (const resolution of doc.core.tradeoffPriorities.conflictResolutions) {
      const scenario = TRADEOFF_SCENARIOS.find((s) => s.id === resolution.scenarioId);
      if (!scenario) continue;

      const chosenOption = resolution.chosenOption === "A" ? scenario.optionA : scenario.optionB;
      const color = LOOP_PDF_COLORS[chosenOption.loopFocus];

      checkNewPage(12);
      pdf.setFontSize(9);
      pdf.setTextColor(...COLORS.lightGray);
      pdf.text(scenario.title + ":", margin + 4, y);
      pdf.setTextColor(...color);
      pdf.setFont("helvetica", "bold");
      pdf.text(chosenOption.label, margin + 4 + pdf.getTextWidth(scenario.title + ": "), y);
      pdf.setFont("helvetica", "normal");
      y += 6;
    }
  }

  // ===== LOOP DIRECTIONS =====
  pdf.addPage();
  y = margin;

  drawSectionHeader("Loop Directions");

  for (const loopId of ALL_LOOPS) {
    const loopDir = doc.loops[loopId];
    if (!loopDir) continue;

    checkNewPage(60);

    const color = LOOP_PDF_COLORS[loopId];

    // Loop header
    pdf.setFillColor(...color);
    pdf.rect(margin, y, contentWidth, 7, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(loopId.toUpperCase(), margin + 4, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(getSeasonLabel(loopDir.currentSeason), margin + contentWidth - 4, y + 5, { align: "right" });
    y += 11;

    // Assessment bars
    const assessments = [
      { label: "Satisfaction", value: loopDir.currentSatisfaction },
      { label: "Current Allocation", value: loopDir.currentAllocation },
      { label: "Desired Allocation", value: loopDir.desiredAllocation },
    ];

    for (const assessment of assessments) {
      checkNewPage(8);
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.lightGray);
      pdf.text(assessment.label, margin + 4, y);

      const barX = margin + 40;
      const barWidth = contentWidth - 60;
      const filledWidth = (assessment.value / 100) * barWidth;

      pdf.setFillColor(...COLORS.bgGray);
      pdf.roundedRect(barX, y - 2.5, barWidth, 3, 1.5, 1.5, "F");
      pdf.setFillColor(...color);
      pdf.roundedRect(barX, y - 2.5, filledWidth, 3, 1.5, 1.5, "F");

      pdf.setTextColor(...COLORS.text);
      pdf.text(`${assessment.value}%`, margin + contentWidth - 4, y, { align: "right" });
      y += 6;
    }
    y += 2;

    // Thriving Vision
    if (loopDir.thrivingDescription.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text("Thriving looks like:", margin + 4, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      const labels = loopDir.thrivingDescription.map((id) =>
        getLoopOptionLabel(loopId, id, LOOP_THRIVING_OPTIONS)
      );
      drawBulletList(labels, 8);
    }

    // Non-negotiables
    if (loopDir.nonNegotiables.length > 0) {
      checkNewPage(15);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text("Non-negotiables:", margin + 4, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      const labels = loopDir.nonNegotiables.map((id) =>
        getLoopOptionLabel(loopId, id, LOOP_NONNEGOTIABLES)
      );
      drawBulletList(labels, 8);
    }

    // Minimum Standards
    if (loopDir.minimumStandards.length > 0) {
      checkNewPage(15);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...COLORS.navy);
      pdf.text("Minimum standards:", margin + 4, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      const labels = loopDir.minimumStandards.map((id) =>
        getLoopOptionLabel(loopId, id, LOOP_MINIMUM_STANDARDS)
      );
      drawBulletList(labels, 8);
    }

    // Dependencies
    if (loopDir.feedsLoops.length > 0 || loopDir.drawsFromLoops.length > 0) {
      checkNewPage(12);
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.lightGray);
      if (loopDir.feedsLoops.length > 0) {
        pdf.text(`Feeds: ${loopDir.feedsLoops.join(", ")}`, margin + 4, y);
        y += 4;
      }
      if (loopDir.drawsFromLoops.length > 0) {
        pdf.text(`Draws from: ${loopDir.drawsFromLoops.join(", ")}`, margin + 4, y);
        y += 4;
      }
    }

    y += 8;
  }

  // ===== FOOTER ON LAST PAGE =====
  y = pageHeight - 20;
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.lightGray);
  pdf.text(
    `Generated by Looops on ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Return as blob
  return pdf.output("blob");
}

// Download helper
export function downloadPDF(blob: Blob, filename: string = "my-directions.pdf"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
