import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2, ScanFace, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { EmotionReading, EmotionType, getEmotionColor, emotionLabels, mapEmotionsToHealth, getRecommendations } from '@/lib/healthMapping';
import { toast } from 'sonner';
import { SkinAnalysisPanel } from '@/components/SkinAnalysisPanel';
import { EyeAnalysisPanel } from '@/components/EyeAnalysisPanel';
import { BlinkSignalBanner } from '@/components/BlinkSignalBanner';
import { GestureSignalsPanel } from '@/components/GestureSignalsPanel';

export interface SkinAnalysis {
  condition: string;
  hydration: string;
  concerns: string[];
  skinTone: string;
  overallScore: number;
}

export interface EyeAnalysis {
  strain: string;
  redness: string;
  darkCircles: string;
  moisture: string;
  pupilDilation: string;
  retinaObservation: string;
  overallHealth: string;
}

export interface BlinkDetection {
  isBlinking: boolean;
  eyeOpenness: string;
}

export interface GestureSignal {
  gesture: string;
  meaning: string;
  confidence: number;
}

interface FaceAnalysisResult {
  emotions: { emotion: EmotionType; confidence: number }[];
  facialDetails: string;
  overallMood: string;
  skinAnalysis?: SkinAnalysis;
  eyeAnalysis?: EyeAnalysis;
  blinkDetection?: BlinkDetection;
  gestureSignals?: GestureSignal[];
}

export function WebcamAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<FaceAnalysisResult | null>(null);
  const [healthFromFace, setHealthFromFace] = useState<ReturnType<typeof mapEmotionsToHealth> | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [blinkCount, setBlinkCount] = useState(0);
  const [signalMessage, setSignalMessage] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const autoCaptureRef = useRef(false);
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch {
      toast.error('Unable to access camera. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setBlinkCount(0);
    setSignalMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Blink pattern detection — reset after 8 seconds of no new blinks
  useEffect(() => {
    if (blinkCount > 0 && blinkCount < 3) {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = setTimeout(() => setBlinkCount(0), 8000);
    }
    if (blinkCount >= 3) {
      setSignalMessage('👋 Good Morning, Ma\'am! Have a wonderful day!');
      toast.success('Blink signal detected! 👋');
      setTimeout(() => {
        setSignalMessage(null);
        setBlinkCount(0);
      }, 6000);
    }
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [blinkCount]);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = dataUrl.split(',')[1];

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-face', {
        body: { imageBase64: base64 },
      });

      if (error) {
        toast.error('Analysis failed. Please try again.');
        console.error(error);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data as FaceAnalysisResult;
      setLastResult(result);

      // Track blinks
      if (result.blinkDetection?.isBlinking) {
        setBlinkCount(prev => prev + 1);
      }

      const emotionReadings: EmotionReading[] = result.emotions.map(e => ({
        emotion: e.emotion,
        confidence: e.confidence,
        timestamp: new Date(),
      }));

      const health = mapEmotionsToHealth(emotionReadings);
      setHealthFromFace(health);

      const dominant = result.emotions[0]?.emotion ?? 'neutral';
      setRecommendations(getRecommendations(dominant, health));
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze face.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Auto-capture loop
  useEffect(() => {
    autoCaptureRef.current = autoCapture;
  }, [autoCapture]);

  useEffect(() => {
    if (!isActive || !autoCapture) return;
    const interval = setInterval(() => {
      if (autoCaptureRef.current && !isAnalyzing) {
        captureAndAnalyze();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isActive, autoCapture, captureAndAnalyze, isAnalyzing]);

  return (
    <div className="metric-card">
      <div className="scan-line" />

      {/* Signal Message Banner */}
      <BlinkSignalBanner message={signalMessage} blinkCount={blinkCount} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Live Face Analysis
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={isActive ? stopCamera : startCamera}
          className="gap-1.5 text-xs border-border"
        >
          {isActive ? <CameraOff className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
          {isActive ? 'Stop' : 'Start'}
        </Button>
      </div>

      {/* Video Feed - Larger */}
      <div className="relative rounded-lg overflow-hidden bg-secondary mb-3 aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
        />
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Camera className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs">Camera off</p>
          </div>
        )}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}
        {/* Blink counter overlay */}
        {isActive && blinkCount > 0 && (
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-mono text-primary">
            Blinks: {blinkCount}/3
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Analyze Buttons */}
      {isActive && (
        <div className="flex gap-2 mb-3">
          <Button
            onClick={captureAndAnalyze}
            disabled={isAnalyzing}
            className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" />
                Analyze
              </>
            )}
          </Button>
          <Button
            variant={autoCapture ? "destructive" : "outline"}
            onClick={() => setAutoCapture(!autoCapture)}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3 h-3 ${autoCapture ? 'animate-spin' : ''}`} />
            {autoCapture ? 'Stop Auto' : 'Auto'}
          </Button>
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Overall Mood */}
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall Mood</span>
              <p className="text-lg font-semibold text-foreground capitalize">{lastResult.overallMood}</p>
            </div>

            {/* Emotion Bars */}
            <div className="space-y-1.5">
              {lastResult.emotions.map((e) => (
                <div key={e.emotion} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary-foreground">{emotionLabels[e.emotion]}</span>
                    <span className="font-mono text-muted-foreground">{e.confidence}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getEmotionColor(e.emotion) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${e.confidence}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Facial Details */}
            <div className="p-3 rounded-md bg-secondary/50">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Facial Details</span>
              <p className="text-xs text-secondary-foreground mt-1">{lastResult.facialDetails}</p>
            </div>

            {/* Skin Analysis */}
            {lastResult.skinAnalysis && (
              <SkinAnalysisPanel skin={lastResult.skinAnalysis} />
            )}

            {/* Eye Analysis */}
            {lastResult.eyeAnalysis && (
              <EyeAnalysisPanel eye={lastResult.eyeAnalysis} />
            )}

            {/* Gesture Signals */}
            {lastResult.gestureSignals && lastResult.gestureSignals.length > 0 && (
              <GestureSignalsPanel gestures={lastResult.gestureSignals} />
            )}

            {/* Derived Health */}
            {healthFromFace && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'HR', value: healthFromFace.heartRate, unit: 'BPM' },
                  { label: 'HRV', value: healthFromFace.hrv, unit: 'ms' },
                  { label: 'Cortisol', value: healthFromFace.cortisolIndex, unit: 'idx' },
                  { label: 'SpO₂', value: healthFromFace.oxygenSaturation, unit: '%' },
                  { label: 'Breath', value: healthFromFace.breathingRate, unit: 'br/m' },
                  { label: 'React', value: healthFromFace.reactionTime, unit: 'ms' },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 rounded bg-secondary/30">
                    <div className="text-[10px] text-muted-foreground uppercase">{m.label}</div>
                    <div className="font-mono text-sm text-foreground">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.unit}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Suggestions</span>
                <ul className="mt-1 space-y-1">
                  {recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-secondary-foreground flex gap-1.5">
                      <span className="text-primary shrink-0">›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
