import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Brain, Heart, Activity, Shield, Sparkles } from 'lucide-react';
import { useEmotionSimulator } from '@/hooks/useEmotionSimulator';
import { emotionLabels, type EmotionType, getHealthStatus } from '@/lib/healthMapping';
import jsPDF from 'jspdf';
import logoImg from '@/assets/logo.png';

const MentalHealthCard = () => {
  const navigate = useNavigate();
  const { currentSnapshot, history } = useEmotionSimulator(2000);
  const [personName, setPersonName] = useState('');
  const [personAge, setPersonAge] = useState('');
  const [personGender, setPersonGender] = useState('');

  const getEmotionBreakdown = () => {
    if (!history.length) return [];
    const counts: Record<string, number> = {};
    history.forEach(s => { counts[s.dominantEmotion] = (counts[s.dominantEmotion] || 0) + 1; });
    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion,
        label: emotionLabels[emotion as EmotionType] || emotion,
        percentage: Math.round((count / history.length) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  const getWellnessScore = () => {
    if (!currentSnapshot) return 0;
    const h = currentSnapshot.health;
    let score = 100;
    if (h.heartRate > 100 || h.heartRate < 50) score -= 15;
    if (h.cortisolIndex > 50) score -= 20;
    if (h.oxygenSaturation < 95) score -= 15;
    if (h.hrv < 20) score -= 10;
    if (h.breathingRate > 22) score -= 10;
    return Math.max(0, Math.min(100, score));
  };

  const getMentalHealthGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: '#22c55e', label: 'Excellent' };
    if (score >= 80) return { grade: 'A', color: '#22c55e', label: 'Very Good' };
    if (score >= 70) return { grade: 'B+', color: '#84cc16', label: 'Good' };
    if (score >= 60) return { grade: 'B', color: '#eab308', label: 'Fair' };
    if (score >= 50) return { grade: 'C', color: '#f97316', label: 'Needs Attention' };
    return { grade: 'D', color: '#ef4444', label: 'Critical' };
  };

  const downloadCard = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [140, 90] });
    const wellness = getWellnessScore();
    const gradeInfo = getMentalHealthGrade(wellness);
    const emotions = getEmotionBreakdown();
    const now = new Date();

    // Card background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 140, 90, 'F');

    // Top accent bar
    doc.setFillColor(56, 152, 236);
    doc.rect(0, 0, 140, 3, 'F');

    // Company branding
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('EMOTION DETECTOR', 8, 14);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('AI-Powered Mental Health Assessment', 8, 19);

    // Card ID
    doc.setFontSize(5);
    doc.text(`ID: ED-${Date.now().toString(36).toUpperCase()}`, 108, 10);
    doc.text(`Date: ${now.toLocaleDateString()}`, 108, 14);

    // Divider
    doc.setDrawColor(56, 152, 236);
    doc.setLineWidth(0.3);
    doc.line(8, 22, 132, 22);

    // Person details
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(personName || 'Patient Name', 8, 29);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const details = [personAge ? `Age: ${personAge}` : '', personGender ? `Gender: ${personGender}` : ''].filter(Boolean).join(' | ');
    if (details) doc.text(details, 8, 34);

    // Grade circle
    const cx = 118, cy = 35;
    const gc = gradeInfo.color;
    const r = parseInt(gc.slice(1, 3), 16);
    const g = parseInt(gc.slice(3, 5), 16);
    const b = parseInt(gc.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.circle(cx, cy, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(gradeInfo.grade, cx, cy + 4, { align: 'center' });
    doc.setFontSize(5);
    doc.text(gradeInfo.label, cx, cy + 9, { align: 'center' });

    // Wellness score
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 152, 236);
    doc.text('WELLNESS SCORE', 8, 42);
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`${wellness}%`, 8, 50);

    // Health metrics
    if (currentSnapshot) {
      const h = currentSnapshot.health;
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      const metrics = [
        `HR: ${h.heartRate} BPM`,
        `HRV: ${h.hrv} ms`,
        `SpO₂: ${h.oxygenSaturation}%`,
        `Cortisol: ${h.cortisolIndex}`,
        `BR: ${h.breathingRate}/min`,
      ];
      metrics.forEach((m, i) => {
        doc.text(m, 8 + (i % 3) * 32, 56 + Math.floor(i / 3) * 5);
      });
    }

    // Top emotions
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 152, 236);
    doc.text('EMOTION BREAKDOWN', 8, 68);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    emotions.slice(0, 4).forEach((e, i) => {
      doc.text(`${e.label}: ${e.percentage}%`, 8 + (i % 2) * 50, 73 + Math.floor(i / 2) * 5);
    });

    // Footer
    doc.setDrawColor(56, 152, 236);
    doc.line(8, 83, 132, 83);
    doc.setFontSize(4);
    doc.setTextColor(100, 116, 139);
    doc.text('This card is AI-generated for informational purposes only. Not a medical diagnosis.', 8, 87);
    doc.text('© Emotion Detector | emotiondetector.ai', 108, 87);

    doc.save(`Mental-Health-Card-${now.toISOString().slice(0, 10)}.pdf`);
  };

  const wellness = getWellnessScore();
  const gradeInfo = getMentalHealthGrade(wellness);
  const emotions = getEmotionBreakdown();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Mental Health Card</h1>
          </div>
          <Button size="sm" onClick={downloadCard} className="gap-1.5 text-xs">
            <Download className="w-3 h-3" /> Download
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* Person Details Input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Full Name" className="text-sm" />
                <Input value={personAge} onChange={e => setPersonAge(e.target.value)} placeholder="Age" className="text-sm" />
                <Input value={personGender} onChange={e => setPersonGender(e.target.value)} placeholder="Gender" className="text-sm" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="mental-health-card mx-auto max-w-[560px]">
            {/* Top accent */}
            <div className="h-1.5 bg-primary rounded-t-2xl" />
            <div className="p-5 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground">EMOTION DETECTOR</h2>
                    <p className="text-[9px] text-muted-foreground">AI-Powered Mental Health Assessment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground font-mono">ID: ED-{Date.now().toString(36).toUpperCase().slice(0, 6)}</p>
                  <p className="text-[9px] text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Person & Grade */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-bold text-foreground">{personName || 'Your Name'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[personAge ? `Age: ${personAge}` : '', personGender || ''].filter(Boolean).join(' | ') || 'Enter your details above'}
                  </p>
                </div>
                <div
                  className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: gradeInfo.color }}
                >
                  <span className="text-xl leading-none">{gradeInfo.grade}</span>
                  <span className="text-[7px] mt-0.5">{gradeInfo.label}</span>
                </div>
              </div>

              {/* Wellness Score */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Wellness Score</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground font-mono">{wellness}</span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary mt-1.5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: gradeInfo.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${wellness}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Health Metrics Grid */}
              {currentSnapshot && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Heart Rate', value: `${currentSnapshot.health.heartRate}`, unit: 'BPM', icon: <Heart className="w-3 h-3" /> },
                    { label: 'HRV', value: `${currentSnapshot.health.hrv}`, unit: 'ms', icon: <Activity className="w-3 h-3" /> },
                    { label: 'SpO₂', value: `${currentSnapshot.health.oxygenSaturation}`, unit: '%', icon: <Sparkles className="w-3 h-3" /> },
                    { label: 'Cortisol', value: `${currentSnapshot.health.cortisolIndex}`, unit: 'idx', icon: <Brain className="w-3 h-3" /> },
                    { label: 'Breathing', value: `${currentSnapshot.health.breathingRate}`, unit: '/min', icon: <Activity className="w-3 h-3" /> },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded-lg bg-secondary/50 text-center">
                      <div className="text-primary mx-auto w-fit mb-0.5">{m.icon}</div>
                      <p className="text-xs font-bold text-foreground font-mono">{m.value}<span className="text-[8px] text-muted-foreground ml-0.5">{m.unit}</span></p>
                      <p className="text-[8px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Emotion Breakdown */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Emotion Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {emotions.slice(0, 6).map(e => (
                    <div key={e.emotion} className="flex items-center justify-between p-1.5 rounded bg-secondary/30 text-xs">
                      <span className="text-foreground truncate">{e.label}</span>
                      <span className="font-mono font-bold text-primary ml-1">{e.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border">
                <p className="text-[8px] text-muted-foreground text-center">
                  AI-generated for informational purposes only. Not a medical diagnosis. © Emotion Detector
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MentalHealthCard;
