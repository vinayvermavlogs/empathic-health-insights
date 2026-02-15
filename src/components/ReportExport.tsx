import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmotionHealthSnapshot, emotionLabels, getRecommendations, getHealthStatus } from '@/lib/healthMapping';

interface ReportExportProps {
  history: EmotionHealthSnapshot[];
  sessionId?: string;
}

export function ReportExport({ history, sessionId }: ReportExportProps) {
  const handleExport = () => {
    if (history.length === 0) return;

    const doc = new jsPDF();
    const latest = history[history.length - 1];
    const now = new Date();
    const status = getHealthStatus(latest.health);
    const recommendations = getRecommendations(latest.dominantEmotion, latest.health);

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Emotion & Health Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Session: ${sessionId || 'N/A'}`, 14, 30);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 36);
    doc.text(`Status: ${status.toUpperCase()}`, 14, 42);
    doc.text(`Data Points: ${history.length}`, 14, 48);

    // Emotion Summary Table
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Emotion Summary', 14, 60);

    autoTable(doc, {
      startY: 64,
      head: [['Emotion', 'Confidence', 'Status']],
      body: latest.emotions.map(e => [
        emotionLabels[e.emotion],
        `${e.confidence}%`,
        e.confidence > 50 ? 'Dominant' : e.confidence > 20 ? 'Present' : 'Trace',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [45, 180, 160] },
      styles: { fontSize: 10 },
    });

    // Health Metrics Table
    const healthY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text('Health Indicators', 14, healthY);

    autoTable(doc, {
      startY: healthY + 4,
      head: [['Metric', 'Value', 'Unit', 'Range']],
      body: [
        ['Heart Rate', String(latest.health.heartRate), 'BPM', '60-100'],
        ['HRV', String(latest.health.hrv), 'ms', '20-70'],
        ['Cortisol Index', String(latest.health.cortisolIndex), 'idx', '0-100'],
        ['SpO₂', String(latest.health.oxygenSaturation), '%', '95-100'],
        ['Breathing Rate', String(latest.health.breathingRate), 'br/min', '12-20'],
        ['Reaction Time', String(latest.health.reactionTime), 'ms', '150-300'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [45, 180, 160] },
      styles: { fontSize: 10 },
    });

    // Recommendations
    const recY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text('Recommendations', 14, recY);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    recommendations.forEach((rec, i) => {
      const y = recY + 8 + i * 7;
      if (y < 280) {
        doc.text(`• ${rec}`, 16, y);
      }
    });

    // Detection Log (last 10)
    const logStart = recY + 8 + recommendations.length * 7 + 8;
    if (logStart < 250) {
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text('Detection Log (Recent)', 14, logStart);

      autoTable(doc, {
        startY: logStart + 4,
        head: [['Timestamp', 'Dominant', 'HR', 'HRV', 'Cortisol', 'SpO₂']],
        body: history.slice(-10).map(s => [
          s.timestamp.toLocaleTimeString(),
          s.dominantEmotion,
          String(s.health.heartRate),
          String(s.health.hrv),
          String(s.health.cortisolIndex),
          String(s.health.oxygenSaturation),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [45, 180, 160] },
        styles: { fontSize: 9 },
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report is for informational purposes only and does not constitute medical advice.', 14, 288);

    doc.save(`emotion-health-report-${now.toISOString().slice(0, 10)}.pdf`);
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
