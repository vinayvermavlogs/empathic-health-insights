import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmotionHealthSnapshot, emotionLabels, getRecommendations, getHealthStatus, EmotionType } from '@/lib/healthMapping';

interface ReportExportProps {
  history: EmotionHealthSnapshot[];
  sessionId?: string;
}

const EMOTION_HEX: Record<string, [number, number, number]> = {
  happiness: [34, 197, 94],
  stress: [239, 68, 68],
  anxiety: [245, 158, 11],
  sadness: [59, 130, 246],
  calmness: [6, 182, 212],
  focus: [139, 92, 246],
  fatigue: [107, 114, 128],
  neutral: [163, 163, 163],
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  optimal: [16, 185, 129],
  moderate: [245, 158, 11],
  elevated: [249, 115, 22],
  critical: [239, 68, 68],
};

const STATUS_LABELS: Record<string, string> = {
  optimal: '🟢 Excellent',
  moderate: '🟡 Moderate',
  elevated: '🟠 Needs Attention',
  critical: '🔴 Critical',
};

function drawGradientRect(doc: jsPDF, x: number, y: number, w: number, h: number, c1: [number, number, number], c2: [number, number, number], steps = 30) {
  const stepH = h / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    doc.setFillColor(
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t)
    );
    doc.rect(x, y + i * stepH, w, stepH + 0.5, 'F');
  }
}

function drawCircularScore(doc: jsPDF, score: number, label: string, x: number, y: number, color: [number, number, number]) {
  // Background circle
  doc.setFillColor(245, 247, 250);
  doc.circle(x, y, 14, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.circle(x, y, 14, 'S');

  // Score arc (simulated with thick colored border)
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(2.5);
  // Draw partial arc using line segments
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * (score / 100));
  const segments = Math.max(1, Math.floor(score / 3));
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + (endAngle - startAngle) * (i / segments);
    const a2 = startAngle + (endAngle - startAngle) * ((i + 1) / segments);
    const x1 = x + 12 * Math.cos(a1);
    const y1 = y + 12 * Math.sin(a1);
    const x2 = x + 12 * Math.cos(a2);
    const y2 = y + 12 * Math.sin(a2);
    doc.line(x1, y1, x2, y2);
  }

  // Score text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${score}`, x, y + 2, { align: 'center' });

  // Label
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(label, x, y + 19, { align: 'center' });
}

function drawMiniBar(doc: jsPDF, x: number, y: number, width: number, pct: number, color: [number, number, number]) {
  // Track
  doc.setFillColor(240, 242, 245);
  doc.roundedRect(x, y, width, 4, 2, 2, 'F');
  // Fill
  const fillW = Math.max(2, (pct / 100) * width);
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, fillW, 4, 2, 2, 'F');
}

export function ReportExport({ history, sessionId }: ReportExportProps) {
  const handleExport = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();
    const latest = history[history.length - 1];
    const now = new Date();
    const status = getHealthStatus(latest.health);
    const recommendations = getRecommendations(latest.dominantEmotion, latest.health);
    const h = latest.health;

    // Calculate scores
    const emotionFreq: Record<string, number> = {};
    history.forEach(s => { emotionFreq[s.dominantEmotion] = (emotionFreq[s.dominantEmotion] || 0) + 1; });
    const sortedEmotions = Object.entries(emotionFreq).sort((a, b) => b[1] - a[1]);
    const positiveEmotions = ['happiness', 'calmness', 'focus'];
    const positiveCount = history.filter(s => positiveEmotions.includes(s.dominantEmotion)).length;
    const wellnessScore = Math.round((positiveCount / history.length) * 100);
    const stressScore = Math.min(100, Math.round(h.cortisolIndex * 1.5));
    const vitalScore = Math.round(
      ((h.heartRate >= 60 && h.heartRate <= 100 ? 25 : 10) +
       (h.hrv >= 20 && h.hrv <= 70 ? 25 : 10) +
       (h.oxygenSaturation >= 95 ? 25 : 10) +
       (h.breathingRate >= 12 && h.breathingRate <= 20 ? 25 : 10))
    );
    const overallScore = Math.round((wellnessScore * 0.4) + (vitalScore * 0.3) + ((100 - stressScore) * 0.3));

    const sc = STATUS_COLORS[status] || STATUS_COLORS.optimal;

    // ═══════════════════════════════════════════
    // PAGE 1 — EXECUTIVE SUMMARY
    // ═══════════════════════════════════════════

    // Header gradient
    drawGradientRect(doc, 0, 0, 210, 50, [15, 23, 42], [30, 41, 59]);

    // Accent line
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.rect(0, 50, 210, 2.5, 'F');

    // Logo area
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, 10, 28, 28, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ED', 28, 28, { align: 'center' });
    doc.setFontSize(6);
    doc.text('REPORT', 28, 34, { align: 'center' });

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Mental Health Report', 48, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Comprehensive Emotion & Wellness Analysis', 48, 30);
    doc.text(`${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 48, 38);

    // Right side meta
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Report #ED-${Date.now().toString(36).toUpperCase()}`, 196, 14, { align: 'right' });
    doc.text(`Session: ${sessionId || 'LIVE'}`, 196, 20, { align: 'right' });
    doc.text(`${history.length} data points analyzed`, 196, 26, { align: 'right' });
    doc.text(`Duration: ${history.length > 1 ? Math.round((history[history.length - 1].timestamp.getTime() - history[0].timestamp.getTime()) / 60000) : 0} min`, 196, 32, { align: 'right' });

    // ── Overall Score Card ──
    let y = 60;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, y, 182, 42, 3, 3, 'F');
    doc.setDrawColor(230, 232, 236);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, y, 182, 42, 3, 3, 'S');

    // Overall score circle
    drawCircularScore(doc, overallScore, 'OVERALL', 42, y + 18, overallScore >= 70 ? [16, 185, 129] : overallScore >= 40 ? [245, 158, 11] : [239, 68, 68]);

    // Mini scores
    drawCircularScore(doc, wellnessScore, 'WELLNESS', 82, y + 18, [59, 130, 246]);
    drawCircularScore(doc, vitalScore, 'VITALS', 118, y + 18, [139, 92, 246]);
    drawCircularScore(doc, Math.max(0, 100 - stressScore), 'CALM', 154, y + 18, [6, 182, 212]);

    // Status badge
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.roundedRect(160, y + 32, 32, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(status.toUpperCase(), 176, y + 37, { align: 'center' });

    y += 50;

    // ── Emotion Breakdown ──
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Emotion Breakdown', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 18;

    // Emotion bars with percentage
    latest.emotions.forEach((e, i) => {
      if (y > 260) return;
      const ec = EMOTION_HEX[e.emotion] || [150, 150, 150];
      const label = emotionLabels[e.emotion] || e.emotion;

      // Emotion color dot
      doc.setFillColor(ec[0], ec[1], ec[2]);
      doc.circle(18, y + 2, 2.5, 'F');

      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(label, 24, y + 4);

      // Percentage
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(ec[0], ec[1], ec[2]);
      doc.text(`${e.confidence}%`, 75, y + 4);

      // Bar
      drawMiniBar(doc, 90, y, 100, e.confidence, ec);

      // Intensity label
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const level = e.confidence > 60 ? 'High' : e.confidence > 30 ? 'Moderate' : 'Low';
      doc.text(level, 193, y + 3);

      y += 10;
    });

    y += 4;

    // ── Dominant Emotion Highlight ──
    const dominantColor = EMOTION_HEX[latest.dominantEmotion] || [100, 100, 100];
    doc.setFillColor(dominantColor[0], dominantColor[1], dominantColor[2]);
    doc.roundedRect(14, y, 182, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dominant Mood: ${emotionLabels[latest.dominantEmotion]}`, 22, y + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Detected with ${latest.emotions[0]?.confidence || 0}% confidence across ${history.length} readings`, 22, y + 14);
    y += 24;

    // ── Session Emotion Frequency (Pie-style list) ──
    if (y < 230) {
      doc.setFillColor(59, 130, 246);
      doc.rect(14, y, 3, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Session Emotion Distribution', 20, y + 7);
      doc.setDrawColor(230, 232, 236);
      doc.line(14, y + 12, 196, y + 12);
      y += 18;

      sortedEmotions.forEach(([emotion, count]) => {
        if (y > 265) return;
        const pct = Math.round((count / history.length) * 100);
        const ec = EMOTION_HEX[emotion as EmotionType] || [150, 150, 150];

        doc.setFillColor(ec[0], ec[1], ec[2]);
        doc.circle(18, y + 2, 2, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`${emotionLabels[emotion as EmotionType] || emotion}`, 24, y + 3);

        // Percentage bar
        drawMiniBar(doc, 75, y, 80, pct, ec);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(ec[0], ec[1], ec[2]);
        doc.text(`${pct}%`, 160, y + 3);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`(${count} readings)`, 172, y + 3);

        y += 9;
      });
    }

    // ═══════════════════════════════════════════
    // PAGE 2 — VITALS & HEALTH DETAILS
    // ═══════════════════════════════════════════
    doc.addPage();

    // Mini header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vital Signs & Health Assessment', 14, 13);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Page 2 · ${now.toLocaleDateString()}`, 196, 13, { align: 'right' });

    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.rect(0, 20, 210, 1.5, 'F');

    y = 30;

    // Vital cards in 2x3 grid
    const vitals = [
      { label: 'Heart Rate', value: `${h.heartRate}`, unit: 'BPM', range: '60–100', normal: h.heartRate >= 60 && h.heartRate <= 100, icon: '❤️', pct: Math.min(100, Math.round((h.heartRate / 120) * 100)) },
      { label: 'HRV', value: `${h.hrv}`, unit: 'ms', range: '20–70', normal: h.hrv >= 20 && h.hrv <= 70, icon: '📊', pct: Math.min(100, Math.round((h.hrv / 80) * 100)) },
      { label: 'Cortisol Index', value: `${h.cortisolIndex}`, unit: 'idx', range: '0–40', normal: h.cortisolIndex <= 40, icon: '🧬', pct: Math.min(100, h.cortisolIndex) },
      { label: 'SpO₂', value: `${h.oxygenSaturation}`, unit: '%', range: '95–100', normal: h.oxygenSaturation >= 95, icon: '🫁', pct: h.oxygenSaturation },
      { label: 'Breathing Rate', value: `${h.breathingRate}`, unit: 'br/min', range: '12–20', normal: h.breathingRate >= 12 && h.breathingRate <= 20, icon: '🌬️', pct: Math.min(100, Math.round((h.breathingRate / 25) * 100)) },
      { label: 'Reaction Time', value: `${h.reactionTime}`, unit: 'ms', range: '150–300', normal: h.reactionTime >= 150 && h.reactionTime <= 300, icon: '⚡', pct: Math.min(100, Math.round((300 - Math.min(h.reactionTime, 300)) / 300 * 100 + 30)) },
    ];

    vitals.forEach((v, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 14 + col * 62;
      const cy = y + row * 34;

      const borderColor: [number, number, number] = v.normal ? [209, 250, 229] : [254, 202, 202];
      const bgColor: [number, number, number] = v.normal ? [240, 253, 244] : [254, 242, 242];
      const valueColor: [number, number, number] = v.normal ? [16, 185, 129] : [239, 68, 68];

      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.roundedRect(cx, cy, 58, 30, 3, 3, 'F');
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx, cy, 58, 30, 3, 3, 'S');

      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${v.icon} ${v.label}`, cx + 4, cy + 7);

      // Value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.text(v.value, cx + 4, cy + 18);

      // Unit
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const valWidth = doc.getTextWidth(v.value) * 16 / 7;
      doc.text(v.unit, cx + 6 + valWidth, cy + 18);

      // Range & status
      doc.setFontSize(6);
      doc.text(`Normal: ${v.range}`, cx + 4, cy + 24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.text(v.normal ? '✓ Normal' : '⚠ Abnormal', cx + 36, cy + 24);

      // Mini progress bar
      drawMiniBar(doc, cx + 4, cy + 26, 50, v.pct, valueColor);
    });

    y += 74;

    // ── Risk Assessment ──
    doc.setFillColor(239, 68, 68);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Health Risk Assessment', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 16;

    const riskFactors: { factor: string; risk: string; detail: string; color: [number, number, number] }[] = [];
    if (h.cortisolIndex > 50) riskFactors.push({ factor: '🔴 High Cortisol', risk: 'High', detail: 'Indicates chronic stress — consider relaxation techniques', color: [239, 68, 68] });
    if (h.heartRate > 85) riskFactors.push({ factor: '🟠 Elevated Heart Rate', risk: 'Moderate', detail: 'Above resting baseline — monitor for sustained elevation', color: [249, 115, 22] });
    if (h.oxygenSaturation < 96) riskFactors.push({ factor: '🔴 Low SpO₂', risk: 'High', detail: 'Below optimal — ensure adequate breathing', color: [239, 68, 68] });
    if (h.hrv < 35) riskFactors.push({ factor: '🟡 Low HRV', risk: 'Moderate', detail: 'Reduced autonomic flexibility — may indicate fatigue', color: [245, 158, 11] });
    if (h.breathingRate > 20) riskFactors.push({ factor: '🟠 Fast Breathing', risk: 'Moderate', detail: 'Possible hyperventilation — practice slow breathing', color: [249, 115, 22] });
    if (riskFactors.length === 0) riskFactors.push({ factor: '🟢 All Clear', risk: 'Low', detail: 'All vitals within healthy range — keep it up!', color: [16, 185, 129] });

    riskFactors.forEach((rf) => {
      doc.setFillColor(rf.color[0], rf.color[1], rf.color[2]);
      doc.roundedRect(14, y, 3, 12, 1, 1, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(rf.factor, 20, y + 5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(rf.detail, 20, y + 11);

      // Risk badge
      doc.setFillColor(rf.color[0], rf.color[1], rf.color[2]);
      doc.roundedRect(170, y + 1, 22, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(rf.risk.toUpperCase(), 181, y + 5, { align: 'center' });

      y += 16;
    });

    y += 4;

    // ── Recommendations ──
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Personalized Recommendations', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 18;

    recommendations.forEach((rec, i) => {
      if (y > 265) { doc.addPage(); y = 20; }

      // Numbered circle
      doc.setFillColor(59, 130, 246);
      doc.circle(18, y + 1.5, 3.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}`, 18, y + 3, { align: 'center' });

      // Recommendation text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(rec, 165);
      doc.text(lines, 26, y + 3);

      y += 6 + (lines.length - 1) * 4;
      // Subtle divider
      doc.setDrawColor(240, 242, 245);
      doc.setLineWidth(0.2);
      doc.line(26, y, 196, y);
      y += 4;
    });

    // ═══════════════════════════════════════════
    // PAGE 3 — TIMELINE & TRENDS
    // ═══════════════════════════════════════════
    doc.addPage();

    // Mini header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Session Timeline & Trends', 14, 13);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Page 3 · ${now.toLocaleDateString()}`, 196, 13, { align: 'right' });
    doc.setFillColor(sc[0], sc[1], sc[2]);
    doc.rect(0, 20, 210, 1.5, 'F');

    y = 30;

    // Trend summary table
    doc.setFillColor(139, 92, 246);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Trend Summary', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 16;

    const avgHR = Math.round(history.reduce((a, b) => a + b.health.heartRate, 0) / history.length);
    const avgHRV = Math.round(history.reduce((a, b) => a + b.health.hrv, 0) / history.length);
    const avgCortisol = Math.round(history.reduce((a, b) => a + b.health.cortisolIndex, 0) / history.length);
    const avgSpO2 = Math.round(history.reduce((a, b) => a + b.health.oxygenSaturation, 0) / history.length * 10) / 10;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Average', 'Min', 'Max', 'Status']],
      body: [
        ['❤️ Heart Rate', `${avgHR} BPM`, `${Math.min(...history.map(s => s.health.heartRate))} BPM`, `${Math.max(...history.map(s => s.health.heartRate))} BPM`, avgHR >= 60 && avgHR <= 100 ? '✅ Normal' : '⚠️ Abnormal'],
        ['📊 HRV', `${avgHRV} ms`, `${Math.min(...history.map(s => s.health.hrv))} ms`, `${Math.max(...history.map(s => s.health.hrv))} ms`, avgHRV >= 20 ? '✅ Normal' : '⚠️ Low'],
        ['🧬 Cortisol', `${avgCortisol}`, `${Math.min(...history.map(s => s.health.cortisolIndex))}`, `${Math.max(...history.map(s => s.health.cortisolIndex))}`, avgCortisol <= 40 ? '✅ Normal' : '⚠️ Elevated'],
        ['🫁 SpO₂', `${avgSpO2}%`, `${Math.min(...history.map(s => s.health.oxygenSaturation))}%`, `${Math.max(...history.map(s => s.health.oxygenSaturation))}%`, avgSpO2 >= 95 ? '✅ Normal' : '⚠️ Low'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', cellPadding: 4 },
      bodyStyles: { fontSize: 8, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        4: { fontStyle: 'bold' },
      },
    });

    // Detection Log
    y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFillColor(14, 165, 233);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Detection Timeline Log', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 16;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Time', 'Emotion', 'Confidence', 'HR', 'SpO₂', 'Cortisol']],
      body: history.slice(-15).map((s, i) => [
        String(i + 1),
        s.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        emotionLabels[s.dominantEmotion] || s.dominantEmotion,
        `${s.emotions[0]?.confidence || 0}%`,
        `${s.health.heartRate} BPM`,
        `${s.health.oxygenSaturation}%`,
        `${s.health.cortisolIndex}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', cellPadding: 3 },
      bodyStyles: { fontSize: 7, cellPadding: 3 },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
      },
    });

    // ── What This Report Means (easy to understand section) ──
    y = (doc as any).lastAutoTable.finalY + 12;
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFillColor(245, 158, 11);
    doc.rect(14, y, 3, 10, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('What This Report Means — In Simple Terms', 20, y + 7);
    doc.setDrawColor(230, 232, 236);
    doc.line(14, y + 12, 196, y + 12);
    y += 18;

    const interpretations = [
      `Your overall mental wellness score is ${overallScore}/100 — ${overallScore >= 70 ? 'this is great! Your emotional state is healthy.' : overallScore >= 40 ? 'this is moderate. Some areas need attention.' : 'this needs improvement. Consider seeking support.'}`,
      `Your dominant emotion during this session was "${emotionLabels[latest.dominantEmotion]}" (${latest.emotions[0]?.confidence || 0}% confidence). ${positiveEmotions.includes(latest.dominantEmotion) ? 'This is a positive emotional state.' : 'Consider activities that promote positive emotions.'}`,
      `Stress levels are ${stressScore > 60 ? 'elevated — deep breathing, meditation, or a short walk can help.' : stressScore > 30 ? 'moderate — maintaining current routines is advisable.' : 'low — you are managing stress well.'}`,
      `Your heart and breathing vitals are ${vitalScore >= 80 ? 'within healthy ranges — excellent physical regulation.' : 'showing some variation — keep monitoring and stay hydrated.'}`,
    ];

    interpretations.forEach((text) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(14, y - 2, 182, 12, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(`💡 ${text}`, 174);
      doc.text(lines, 18, y + 4);
      y += 6 + (lines.length) * 4;
    });

    // ═══ FOOTERS ═══
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 282, 210, 16, 'F');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('CONFIDENTIAL — Generated by Emotion Detector AI. For informational purposes only. Not medical advice.', 14, 288);
      doc.text('Consult a healthcare professional for clinical interpretation.', 14, 292);
      doc.text(`Page ${p} of ${totalPages}`, 196, 288, { align: 'right' });
      doc.text(`${now.toISOString()}`, 196, 292, { align: 'right' });
    }

    doc.save(`EmotionDetector-Mental-Health-Report-${now.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={history.length === 0}
      variant="outline"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
    >
      <FileDown className="w-4 h-4" />
      Export PDF Report
    </Button>
  );
}
