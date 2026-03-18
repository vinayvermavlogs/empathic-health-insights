import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmotionHealthSnapshot, emotionLabels, getRecommendations, getHealthStatus, EmotionType } from '@/lib/healthMapping';

interface ReportExportProps {
  history: EmotionHealthSnapshot[];
  sessionId?: string;
}

const STATUS_COLORS: Record<string, [number, number, number]> = {
  optimal: [34, 197, 94],
  moderate: [234, 179, 8],
  elevated: [249, 115, 22],
  critical: [239, 68, 68],
};

const SIGN_LANGUAGE_MAP: Record<string, string> = {
  a: 'Hello!', b: 'Bye, see you soon!', c: 'Call me!', d: 'Great job!',
  e: 'Emergency!', f: 'Friends forever!', g: 'Good to go!', h: 'Going home!',
  i: 'I have an idea!', j: 'Just happy!', k: 'Sending a kiss!', l: 'Love you!',
  m: 'Good morning!', n: 'Good night!', o: 'OK, got it!', p: 'Please!',
  q: 'I have a question!', r: 'Ready to go!', s: 'Shhh, be quiet!', t: 'Thank you!',
  u: 'You! Yes, you!', v: 'Victory / Peace!', w: 'Welcome!', x: 'No / Stop!',
  y: 'Yes! / Hang loose!', z: 'Sleepy / Zzz...',
};

const GESTURE_COMMANDS: Record<string, string> = {
  'Shaking hand left-right': 'Hello / Greeting',
  'Thumbs up': 'Approval / Yes',
  'Thumbs down': 'Disapproval / No',
  'Peace / Victory sign': 'Peace / Victory',
  'OK sign': 'OK / Agreement',
  'Waving hand': 'Hello / Goodbye',
  'Pointing index': 'Directing attention',
  'Open palm': 'Stop / Wait',
  'Closed fist': 'Strength / Solidarity',
  'Heart with hands': 'Love / Affection',
};

function drawHeader(doc: jsPDF, now: Date, sessionId: string, status: string) {
  // Hospital header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 38, 'F');

  // Accent stripe
  const sc = STATUS_COLORS[status] || STATUS_COLORS.optimal;
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.rect(0, 38, 210, 2, 'F');

  // Hospital icon placeholder (cross)
  doc.setFillColor(45, 180, 160);
  doc.roundedRect(14, 8, 22, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('+', 21, 23);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EMOTION DETECTOR HEALTH REPORT', 42, 17);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Comprehensive Emotion & Biometric Analysis', 42, 24);
  doc.text(`Report ID: NS-${Date.now().toString(36).toUpperCase()}`, 42, 30);

  // Right side info
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  const rightX = 196;
  doc.text(`Date: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, rightX, 10, { align: 'right' });
  doc.text(`Time: ${now.toLocaleTimeString()}`, rightX, 15, { align: 'right' });
  doc.text(`Session: ${sessionId}`, rightX, 20, { align: 'right' });
  doc.text(`Data Points: ${0}`, rightX, 25, { align: 'right' }); // will be overwritten
  doc.text(`Status: ${status.toUpperCase()}`, rightX, 30, { align: 'right' });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, color: [number, number, number] = [45, 180, 160]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(14, y - 4, 3, 12, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(title, 20, y + 4);
  // Underline
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, y + 8, 196, y + 8);
  return y + 12;
}

function drawStatusBadge(doc: jsPDF, status: string, x: number, y: number) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.optimal;
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(x, y, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(status.toUpperCase(), x + 15, y + 5.5, { align: 'center' });
}

function drawMetricCard(doc: jsPDF, label: string, value: string, unit: string, range: string, x: number, y: number, isNormal: boolean) {
  // Card bg
  doc.setFillColor(isNormal ? 240 : 255, isNormal ? 253 : 245, isNormal ? 244 : 245);
  doc.roundedRect(x, y, 55, 22, 2, 2, 'F');

  // Border
  doc.setDrawColor(isNormal ? 187 : 252, isNormal ? 247 : 165, isNormal ? 208 : 165);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, 55, 22, 2, 2, 'S');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(label, x + 4, y + 6);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isNormal ? 34 : 239, isNormal ? 197 : 68, isNormal ? 94 : 68);
  doc.text(value, x + 4, y + 15);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(unit, x + 4 + doc.getTextWidth(value) * 14 / doc.getFontSize() + 2, y + 15);
  doc.text(`Normal: ${range}`, x + 4, y + 20);
}

export function ReportExport({ history, sessionId }: ReportExportProps) {
  const handleExport = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();
    const latest = history[history.length - 1];
    const now = new Date();
    const status = getHealthStatus(latest.health);
    const recommendations = getRecommendations(latest.dominantEmotion, latest.health);

    // === PAGE 1 ===
    drawHeader(doc, now, sessionId || 'N/A', status);

    // Patient info bar
    let y = 46;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, 182, 14, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Analysis Duration: ${history.length > 1 ? Math.round((history[history.length - 1].timestamp.getTime() - history[0].timestamp.getTime()) / 60000) : 0} min`, 18, y + 6);
    doc.text(`Total Readings: ${history.length}`, 80, y + 6);
    doc.text(`Dominant Emotion: ${emotionLabels[latest.dominantEmotion]}`, 130, y + 6);
    drawStatusBadge(doc, status, 18, y + 8);
    y += 20;

    // SECTION: Vital Signs
    y = drawSectionTitle(doc, 'VITAL SIGNS & BIOMETRICS', y);
    y += 2;

    const h = latest.health;
    const vitals = [
      { label: 'Heart Rate', value: String(h.heartRate), unit: 'BPM', range: '60–100', normal: h.heartRate >= 60 && h.heartRate <= 100 },
      { label: 'Heart Rate Variability', value: String(h.hrv), unit: 'ms', range: '20–70', normal: h.hrv >= 20 && h.hrv <= 70 },
      { label: 'Cortisol Stress Index', value: String(h.cortisolIndex), unit: 'idx', range: '0–40', normal: h.cortisolIndex <= 40 },
      { label: 'Oxygen Saturation (SpO₂)', value: String(h.oxygenSaturation), unit: '%', range: '95–100', normal: h.oxygenSaturation >= 95 },
      { label: 'Breathing Rate', value: String(h.breathingRate), unit: 'br/min', range: '12–20', normal: h.breathingRate >= 12 && h.breathingRate <= 20 },
      { label: 'Reaction Time', value: String(h.reactionTime), unit: 'ms', range: '150–300', normal: h.reactionTime >= 150 && h.reactionTime <= 300 },
    ];

    vitals.forEach((v, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      drawMetricCard(doc, v.label, v.value, v.unit, v.range, 14 + col * 61, y + row * 26, v.normal);
    });
    y += 56;

    // SECTION: Emotional Analysis
    y = drawSectionTitle(doc, 'EMOTIONAL STATE ANALYSIS', y);
    autoTable(doc, {
      startY: y,
      head: [['Emotion', 'Confidence', 'Intensity Level', 'Clinical Indicator']],
      body: latest.emotions.map(e => {
        const level = e.confidence > 60 ? 'HIGH' : e.confidence > 30 ? 'MODERATE' : 'LOW';
        const indicator = e.confidence > 60 ? 'Primary State' : e.confidence > 30 ? 'Secondary State' : 'Background Trace';
        return [emotionLabels[e.emotion], `${e.confidence}%`, level, indicator];
      }),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 50 },
      },
    });

    // SECTION: Health Assessment
    y = (doc as any).lastAutoTable.finalY + 10;
    y = drawSectionTitle(doc, 'HEALTH RISK ASSESSMENT', y);

    // Risk assessment summary
    const riskFactors = [];
    if (h.cortisolIndex > 50) riskFactors.push({ factor: 'Elevated Cortisol', risk: 'High', detail: 'Indicates chronic stress response' });
    if (h.heartRate > 85) riskFactors.push({ factor: 'Elevated Heart Rate', risk: 'Moderate', detail: 'Above resting baseline' });
    if (h.oxygenSaturation < 96) riskFactors.push({ factor: 'Low SpO₂', risk: 'High', detail: 'Below optimal oxygenation threshold' });
    if (h.hrv < 35) riskFactors.push({ factor: 'Low HRV', risk: 'Moderate', detail: 'Reduced autonomic nervous system flexibility' });
    if (h.breathingRate > 20) riskFactors.push({ factor: 'Elevated Breathing', risk: 'Moderate', detail: 'Possible hyperventilation pattern' });
    if (riskFactors.length === 0) riskFactors.push({ factor: 'No Significant Risks', risk: 'Low', detail: 'All vitals within normal parameters' });

    autoTable(doc, {
      startY: y,
      head: [['Risk Factor', 'Severity', 'Clinical Detail']],
      body: riskFactors.map(r => [r.factor, r.risk, r.detail]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      styles: { cellPadding: 3 },
    });

    // SECTION: Clinical Recommendations
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 240) { doc.addPage(); y = 20; }
    y = drawSectionTitle(doc, 'CLINICAL RECOMMENDATIONS', y, [59, 130, 246]);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    recommendations.forEach((rec, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(14, y - 3, 182, 8, 'F');
      doc.setFillColor(59, 130, 246);
      doc.circle(18, y + 1, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text(String(i + 1), 17, y + 2.5);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(8);
      doc.text(rec, 24, y + 2);
      y += 10;
    });

    // === PAGE 2 ===
    doc.addPage();
    y = 20;

    // SECTION: Gesture & Sign Language Detection Reference
    y = drawSectionTitle(doc, 'GESTURE COMMAND REFERENCE', y, [168, 85, 247]);

    autoTable(doc, {
      startY: y,
      head: [['Gesture / Hand Position', 'Command / Meaning']],
      body: Object.entries(GESTURE_COMMANDS).map(([gesture, meaning]) => [gesture, meaning]),
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { cellPadding: 3 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // SECTION: Sign Language Letter Mapping
    y = drawSectionTitle(doc, 'ASL SIGN LANGUAGE DETECTION MAP', y, [236, 72, 153]);

    const signRows = Object.entries(SIGN_LANGUAGE_MAP).map(([letter, msg]) => [letter.toUpperCase(), msg]);
    // Split into 2 columns of 13 rows each
    const half = Math.ceil(signRows.length / 2);
    const leftCol = signRows.slice(0, half);
    const rightCol = signRows.slice(half);
    const mergedRows = leftCol.map((l, i) => {
      const r = rightCol[i] || ['', ''];
      return [l[0], l[1], r[0], r[1]];
    });

    autoTable(doc, {
      startY: y,
      head: [['Letter', 'Message', 'Letter', 'Message']],
      body: mergedRows,
      theme: 'grid',
      headStyles: { fillColor: [219, 39, 119], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [253, 242, 248] },
      styles: { cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 75 },
        2: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 75 },
      },
    });

    // SECTION: Detection Timeline Log
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 220) { doc.addPage(); y = 20; }
    y = drawSectionTitle(doc, 'DETECTION TIMELINE LOG', y, [14, 165, 233]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Timestamp', 'Dominant Emotion', 'HR (BPM)', 'HRV (ms)', 'Cortisol', 'SpO₂ (%)', 'Breathing']],
      body: history.slice(-15).map((s, i) => [
        String(i + 1),
        s.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        emotionLabels[s.dominantEmotion] || s.dominantEmotion,
        String(s.health.heartRate),
        String(s.health.hrv),
        String(s.health.cortisolIndex),
        String(s.health.oxygenSaturation),
        String(s.health.breathingRate),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      styles: { cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24 },
      },
    });

    // SECTION: Trend Summary
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    y = drawSectionTitle(doc, 'SESSION TREND SUMMARY', y, [245, 158, 11]);

    // Calculate averages
    const avgHR = Math.round(history.reduce((a, b) => a + b.health.heartRate, 0) / history.length);
    const avgHRV = Math.round(history.reduce((a, b) => a + b.health.hrv, 0) / history.length);
    const avgCortisol = Math.round(history.reduce((a, b) => a + b.health.cortisolIndex, 0) / history.length);
    const avgSpO2 = Math.round(history.reduce((a, b) => a + b.health.oxygenSaturation, 0) / history.length * 10) / 10;

    // Emotion frequency
    const emotionFreq: Record<string, number> = {};
    history.forEach(s => {
      emotionFreq[s.dominantEmotion] = (emotionFreq[s.dominantEmotion] || 0) + 1;
    });
    const sortedEmotions = Object.entries(emotionFreq).sort((a, b) => b[1] - a[1]);

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Average', 'Min', 'Max', 'Assessment']],
      body: [
        ['Heart Rate', `${avgHR} BPM`, `${Math.min(...history.map(h => h.health.heartRate))} BPM`, `${Math.max(...history.map(h => h.health.heartRate))} BPM`, avgHR >= 60 && avgHR <= 100 ? 'Normal' : 'Abnormal'],
        ['HRV', `${avgHRV} ms`, `${Math.min(...history.map(h => h.health.hrv))} ms`, `${Math.max(...history.map(h => h.health.hrv))} ms`, avgHRV >= 20 ? 'Normal' : 'Low'],
        ['Cortisol', `${avgCortisol}`, `${Math.min(...history.map(h => h.health.cortisolIndex))}`, `${Math.max(...history.map(h => h.health.cortisolIndex))}`, avgCortisol <= 40 ? 'Normal' : 'Elevated'],
        ['SpO₂', `${avgSpO2}%`, `${Math.min(...history.map(h => h.health.oxygenSaturation))}%`, `${Math.max(...history.map(h => h.health.oxygenSaturation))}%`, avgSpO2 >= 95 ? 'Normal' : 'Low'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      styles: { cellPadding: 3 },
    });

    // Dominant emotion breakdown
    y = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Emotion Frequency Distribution:', 14, y + 4);
    y += 8;
    sortedEmotions.forEach(([emotion, count]) => {
      const pct = Math.round((count / history.length) * 100);
      const barWidth = pct * 1.2;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(14, y, 120, 5, 1, 1, 'F');
      doc.setFillColor(45, 180, 160);
      doc.roundedRect(14, y, Math.min(barWidth, 120), 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`${emotionLabels[emotion as EmotionType] || emotion}  (${pct}%)`, 138, y + 4);
      y += 7;
    });

    // === FOOTER on all pages ===
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      // Footer band
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 282, 210, 16, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 282, 196, 282);

      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('CONFIDENTIAL — This report is generated by NeuroSense AI for informational purposes only and does not constitute medical advice.', 14, 287);
      doc.text('Consult a healthcare professional for clinical interpretation. AI-based analysis may have limitations.', 14, 291);
      doc.text(`Page ${p} of ${totalPages}`, 196, 287, { align: 'right' });
      doc.text(`Generated: ${now.toISOString()}`, 196, 291, { align: 'right' });
    }

    doc.save(`NeuroSense-Health-Report-${now.toISOString().slice(0, 10)}.pdf`);
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
