import { motion } from 'framer-motion';
import { Activity, Pause, Play, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmotionSimulator } from '@/hooks/useEmotionSimulator';
import { getRecommendations } from '@/lib/healthMapping';
import { EmotionPanel } from '@/components/EmotionPanel';
import { HealthMetricsPanel } from '@/components/HealthMetricsPanel';
import { EmotionTimeline } from '@/components/EmotionTimeline';
import { HealthTimeline } from '@/components/HealthTimeline';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { DetectionLog } from '@/components/DetectionLog';
import { ReportExport } from '@/components/ReportExport';
import { WebcamAnalysis } from '@/components/WebcamAnalysis';

const Index = () => {
  const { currentSnapshot, history, isLive, setIsLive } = useEmotionSimulator(2000);

  if (!currentSnapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="w-8 h-8 text-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Initializing sensors...</p>
        </div>
      </div>
    );
  }

  const recommendations = getRecommendations(currentSnapshot.dominantEmotion, currentSnapshot.health);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">NeuroSense</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Emotion & Health Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              {currentSnapshot.timestamp.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-1.5 text-xs border-border"
            >
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            <ReportExport history={history} sessionId="SESSION-001" />
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4"
        >
          {/* Left Column - Webcam & Emotions */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4 order-1">
            <WebcamAnalysis />
          </div>

          {/* Center Column - Charts */}
          <div className="md:col-span-1 lg:col-span-5 space-y-4 order-3 lg:order-2">
            <HealthMetricsPanel metrics={currentSnapshot.health} />
            <EmotionTimeline history={history} />
            <HealthTimeline history={history} />
          </div>

          {/* Right Column - Panels & Log */}
          <div className="md:col-span-1 lg:col-span-3 space-y-4 order-2 lg:order-3">
            <EmotionPanel
              emotions={currentSnapshot.emotions}
              dominantEmotion={currentSnapshot.dominantEmotion}
            />
            <RecommendationsPanel recommendations={recommendations} />
            <DetectionLog history={history} />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
