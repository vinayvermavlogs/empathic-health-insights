import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, TrendingUp, BarChart3, Trash2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getEmotionColor, emotionLabels, type EmotionType } from '@/lib/healthMapping';
import logoImg from '@/assets/logo.png';

interface MoodResult {
  id: string;
  timestamp: Date;
  imageUrl: string;
  emotions: { emotion: EmotionType; confidence: number }[];
  overallMood: string;
}

const EMOTION_COLORS: Record<string, string> = {
  happiness: '#22c55e',
  stress: '#ef4444',
  anxiety: '#f59e0b',
  sadness: '#3b82f6',
  calmness: '#06b6d4',
  focus: '#8b5cf6',
  fatigue: '#6b7280',
  neutral: '#a3a3a3',
};

export default function MoodAnalysis() {
  const [results, setResults] = useState<MoodResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const analyzeImage = useCallback(async (file: File) => {
    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreviewUrl(URL.createObjectURL(file));

      const { data, error } = await supabase.functions.invoke('analyze-face', {
        body: { imageBase64: base64 },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const emotions: { emotion: EmotionType; confidence: number }[] = (data.emotions || [])
        .map((e: any) => ({ emotion: e.emotion as EmotionType, confidence: e.confidence }))
        .sort((a: any, b: any) => b.confidence - a.confidence);

      const newResult: MoodResult = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        imageUrl: URL.createObjectURL(file),
        emotions,
        overallMood: data.overallMood || emotions[0]?.emotion || 'neutral',
      };

      setResults(prev => [...prev, newResult]);
      toast({ title: 'Analysis Complete', description: `Detected mood: ${newResult.overallMood}` });
    } catch (e: any) {
      toast({ title: 'Analysis Failed', description: e.message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
      setPreviewUrl(null);
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) analyzeImage(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) analyzeImage(file);
  };

  // Build chart data from all results
  const chartData = results.map((r, i) => {
    const point: any = { name: `Scan ${i + 1}`, time: r.timestamp.toLocaleTimeString() };
    r.emotions.forEach(e => { point[e.emotion] = e.confidence; });
    return point;
  });

  const allEmotions = Array.from(new Set(results.flatMap(r => r.emotions.map(e => e.emotion))));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={logoImg} alt="Logo" className="w-8 h-8 rounded-lg" />
          <h1 className="text-lg font-bold">Photo Mood Analyzer</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Zone */}
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed border-primary/30 rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {analyzing ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {previewUrl && <img src={previewUrl} alt="Analyzing" className="w-32 h-32 object-cover rounded-xl mx-auto opacity-60" />}
                  <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Analyzing mood patterns...</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold">Drop a photo or click to upload</p>
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Comparison Graph */}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Mood Prediction Comparison
                  <span className="ml-auto text-xs text-muted-foreground font-normal">{results.length} scans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        {allEmotions.map(emotion => (
                          <linearGradient key={emotion} id={`grad-${emotion}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={EMOTION_COLORS[emotion] || '#888'} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={EMOTION_COLORS[emotion] || '#888'} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      {allEmotions.map(emotion => (
                        <Area
                          key={emotion}
                          type="monotone"
                          dataKey={emotion}
                          stroke={EMOTION_COLORS[emotion] || '#888'}
                          fill={`url(#grad-${emotion})`}
                          strokeWidth={2}
                          dot={{ r: 4, fill: EMOTION_COLORS[emotion] || '#888' }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Scan History
              </h2>
              <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setResults([])}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {[...results].reverse().map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img src={r.imageUrl} alt="Scanned" className="w-full h-40 object-cover" />
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold capitalize">
                          {r.overallMood}
                        </div>
                      </div>
                      <CardContent className="p-3 space-y-2">
                        {r.emotions.slice(0, 5).map(e => {
                          const label = emotionLabels[e.emotion] || e.emotion;
                          return (
                            <div key={e.emotion} className="flex items-center gap-2">
                              <span className="text-xs w-20 truncate capitalize">{label}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${e.confidence}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: EMOTION_COLORS[e.emotion] || '#888' }}
                                />
                              </div>
                              <span className="text-[11px] font-mono font-semibold w-10 text-right" style={{ color: EMOTION_COLORS[e.emotion] }}>
                                {e.confidence}%
                              </span>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !analyzing && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Upload photos to start analyzing mood patterns</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Each scan adds to the comparison graph above</p>
          </div>
        )}
      </main>
    </div>
  );
}
