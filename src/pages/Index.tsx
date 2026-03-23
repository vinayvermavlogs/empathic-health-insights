import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Pause, Play, Sun, Moon, Menu, X, User, Save, LogIn, Bot, Layers, FileText, ImageUp, Upload, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmotionSimulator } from '@/hooks/useEmotionSimulator';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSaver } from '@/hooks/useSessionSaver';
import { getRecommendations, type EmotionType } from '@/lib/healthMapping';
import { EmotionPanel } from '@/components/EmotionPanel';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { DetectionLog } from '@/components/DetectionLog';
import { ReportExport } from '@/components/ReportExport';
import { WebcamAnalysis } from '@/components/WebcamAnalysis';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { LiveSubtitles } from '@/components/LiveSubtitles';
import { AISessionSummary } from '@/components/AISessionSummary';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import logoImg from '@/assets/logo.png';

const Index = () => {
  const { currentSnapshot, history, isLive, setIsLive } = useEmotionSimulator(2000);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { saveSession } = useSessionSaver();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoResults, setPhotoResults] = useState<{ id: string; time: string; emotions: { emotion: EmotionType; confidence: number }[]; mood: string; imgUrl: string }[]>([]);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [liveResults, setLiveResults] = useState<{ time: string; emotions: { emotion: EmotionType; confidence: number }[]; mood: string }[]>([]);

  const EMOTION_COLORS: Record<string, string> = {
    happiness: '#22c55e', stress: '#ef4444', anxiety: '#f59e0b', sadness: '#3b82f6',
    calmness: '#06b6d4', focus: '#8b5cf6', fatigue: '#6b7280', neutral: '#a3a3a3',
  };

  const analyzePhoto = useCallback(async (file: File) => {
    setPhotoAnalyzing(true);
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('analyze-face', { body: { imageBase64: base64 } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const emotions = (data.emotions || []).map((e: any) => ({ emotion: e.emotion as EmotionType, confidence: e.confidence })).sort((a: any, b: any) => b.confidence - a.confidence);
      setPhotoResults(prev => [...prev, {
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString(),
        emotions,
        mood: data.overallMood || emotions[0]?.emotion || 'neutral',
        imgUrl: URL.createObjectURL(file),
      }]);
      toast({ title: 'Mood Detected', description: `Overall: ${data.overallMood || emotions[0]?.emotion}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setPhotoAnalyzing(false);
    }
  }, [toast]);

  const photoChartData = photoResults.map((r, i) => {
    const pt: any = { name: `#${i + 1}`, time: r.time };
    r.emotions.forEach(e => { pt[e.emotion] = e.confidence; });
    return pt;
  });
  const allPhotoEmotions = Array.from(new Set(photoResults.flatMap(r => r.emotions.map(e => e.emotion))));

  const handleSaveSession = () => {
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
    saveSession(history, durationSeconds);
    sessionStartRef.current = Date.now();
  };

  if (!currentSnapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
      <header className="border-b border-border sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
        <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Emotion Detector" className="w-9 h-9 rounded-xl object-contain" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Emotion Detector</h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium hidden xs:block">AI-Powered Emotion & Health Monitor</p>
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              🕐 {currentSnapshot.timestamp.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)} className="gap-1.5 text-xs border-border h-8">
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-1.5 text-xs border-border h-8">
              {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            </Button>
            <ReportExport history={history} sessionId="SESSION-001" />
            <Button variant="outline" size="sm" onClick={() => navigate('/mental-health-card')} className="gap-1.5 text-xs border-border h-8">
              <FileText className="w-3 h-3" /> <span className="hidden lg:inline">Health Card</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/ai-chat')} className="gap-1.5 text-xs border-border h-8">
              <Bot className="w-3 h-3" /> <span className="hidden lg:inline">AI Chat</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/architecture')} className="gap-1.5 text-xs border-border h-8">
              <Layers className="w-3 h-3" /> <span className="hidden lg:inline">Arch</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/mood-analysis')} className="gap-1.5 text-xs border-border h-8">
              <ImageUp className="w-3 h-3" /> <span className="hidden lg:inline">Photo Mood</span>
            </Button>
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveSession} className="gap-1.5 text-xs border-border h-8">
                  <Save className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-1.5 text-xs border-border h-8">
                  <User className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-1.5 text-xs border-border h-8">
                <LogIn className="w-3 h-3" /> <span className="hidden lg:inline">Sign In</span>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border bg-background"
            >
              <div className="px-3 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  🕐 {currentSnapshot.timestamp.toLocaleTimeString()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsLive(!isLive); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                    {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isLive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                  </Button>
                  <div><ReportExport history={history} sessionId="SESSION-001" /></div>
                  <Button variant="outline" size="sm" onClick={() => { navigate('/mental-health-card'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                    <FileText className="w-3 h-3" /> Health Card
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { navigate('/ai-chat'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                    <Bot className="w-3 h-3" /> AI Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { navigate('/architecture'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                    <Layers className="w-3 h-3" /> Architecture
                  </Button>
                  {user ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { handleSaveSession(); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                        <Save className="w-3 h-3" /> Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border">
                        <User className="w-3 h-3" /> Profile
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border col-span-2">
                      <LogIn className="w-3 h-3" /> Sign In
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dashboard */}
      <main className="container max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4"
        >
          {/* Left Column - Webcam */}
          <div className="md:col-span-2 lg:col-span-5 space-y-3 sm:space-y-4 order-1">
            <WebcamAnalysis onScanResult={(r) => {
              setLiveResults(prev => [...prev, {
                time: r.timestamp.toLocaleTimeString(),
                emotions: r.emotions,
                mood: r.mood,
              }]);
            }} />

            {/* Live Camera Mood Graph */}
            {liveResults.length > 0 && (() => {
              const liveChartData = liveResults.map((r, i) => {
                const pt: any = { name: `#${i + 1}`, time: r.time };
                r.emotions.forEach(e => { pt[e.emotion] = e.confidence; });
                return pt;
              });
              const allLiveEmotions = Array.from(new Set(liveResults.flatMap(r => r.emotions.map(e => e.emotion))));
              const latest = liveResults[liveResults.length - 1];
              const prev = liveResults.length > 1 ? liveResults[liveResults.length - 2] : null;

              // Efficiency: avg confidence of dominant emotion over all scans
              const dominantEm = latest.emotions[0]?.emotion;
              const avgDominant = dominantEm
                ? liveResults.reduce((sum, r) => sum + (r.emotions.find(e => e.emotion === dominantEm)?.confidence || 0), 0) / liveResults.length
                : 0;

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-[#131722] border-[#1e222d] overflow-hidden">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-[#d1d4dc]">
                          <BarChart3 className="w-3.5 h-3.5 text-[#26a69a]" /> Live Camera Mood · {liveResults.length} Scans
                        </CardTitle>
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[60%] sm:max-w-none justify-end">
                          {allLiveEmotions.slice(0, 4).map(em => (
                            <span key={em} className="flex items-center gap-0.5 text-[7px] sm:text-[8px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: EMOTION_COLORS[em] }} />
                              <span style={{ color: EMOTION_COLORS[em] }}>{em}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-40 sm:h-52 px-1 sm:px-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={liveChartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                            <defs>
                              {allLiveEmotions.map(em => (
                                <linearGradient key={em} id={`lg-${em}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={EMOTION_COLORS[em] || '#888'} stopOpacity={0.2} />
                                  <stop offset="100%" stopColor={EMOTION_COLORS[em] || '#888'} stopOpacity={0} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid stroke="#1e222d" strokeDasharray="none" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#787b86' }} axisLine={{ stroke: '#1e222d' }} tickLine={{ stroke: '#1e222d' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#787b86' }} axisLine={{ stroke: '#1e222d' }} tickLine={{ stroke: '#1e222d' }} unit="%" width={35} />
                            <Tooltip
                              contentStyle={{ background: '#1e222d', border: '1px solid #363a45', borderRadius: '4px', fontSize: '10px', color: '#d1d4dc' }}
                              itemStyle={{ color: '#d1d4dc', fontSize: '10px' }}
                              labelStyle={{ color: '#787b86', fontSize: '9px' }}
                              cursor={{ stroke: '#363a45', strokeDasharray: '3 3' }}
                            />
                            {allLiveEmotions.map((em, i) => (
                              <Area key={em} type="monotone" dataKey={em} stroke={EMOTION_COLORS[em] || '#888'} fill={`url(#lg-${em})`} strokeWidth={i === 0 ? 2.5 : 1.5} dot={false} activeDot={{ r: 4, stroke: EMOTION_COLORS[em], fill: '#131722', strokeWidth: 2 }} connectNulls />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Comparison & Efficiency */}
                      <div className="border-t border-[#1e222d] px-4 py-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-[#787b86] font-mono">Scan Comparison</p>
                          <div className="flex items-center gap-1.5 bg-[#1e222d] rounded px-2 py-0.5">
                            <span className="text-[8px] text-[#787b86] font-mono">Efficiency</span>
                            <span className="text-[10px] font-mono font-bold text-[#26a69a]">{avgDominant.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {latest.emotions.slice(0, 6).map(e => {
                            const prevVal = prev?.emotions.find(p => p.emotion === e.emotion)?.confidence || 0;
                            const diff = e.confidence - prevVal;
                            return (
                              <div key={e.emotion} className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EMOTION_COLORS[e.emotion] }} />
                                <span className="text-[10px] font-mono capitalize" style={{ color: EMOTION_COLORS[e.emotion] }}>{e.emotion}</span>
                                <span className="text-[10px] font-mono font-bold" style={{ color: EMOTION_COLORS[e.emotion] }}>{e.confidence}%</span>
                                {prev && (
                                  <span className={`text-[9px] font-mono ${diff >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(diff).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}

            <LiveSubtitles />
          </div>

          {/* Center Column - Photo Mood & AI */}
          <div className="md:col-span-1 lg:col-span-4 space-y-3 sm:space-y-4 order-3 lg:order-2">
            {/* Photo Upload */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-primary" /> Upload Photo for Mood Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) analyzePhoto(f); e.target.value = ''; }} />
                <Button
                  variant="outline"
                  className="w-full h-16 sm:h-20 border-dashed border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 gap-2 text-xs"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoAnalyzing}
                >
                  {photoAnalyzing ? (
                    <><span className="animate-spin">⏳</span> Analyzing...</>
                  ) : (
                    <><ImageUp className="w-5 h-5 text-primary" /> Drop or click to upload photo</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Mood Comparison Graph - Trading Chart Style */}
            {photoResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-[#131722] border-[#1e222d] overflow-hidden">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs flex items-center gap-1.5 text-[#d1d4dc]">
                        <TrendingUp className="w-3.5 h-3.5 text-[#2962ff]" /> Mood Prediction · Live
                      </CardTitle>
                      <div className="flex items-center gap-1.5 flex-wrap max-w-[55%] sm:max-w-none justify-end">
                        {allPhotoEmotions.slice(0, 4).map(em => (
                          <span key={em} className="flex items-center gap-0.5 text-[7px] sm:text-[9px] font-mono">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: EMOTION_COLORS[em] }} />
                            <span style={{ color: EMOTION_COLORS[em] }}>{em}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Main chart */}
                    <div className="h-48 px-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={photoChartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                          <defs>
                            {allPhotoEmotions.map(em => (
                              <linearGradient key={em} id={`mg-${em}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={EMOTION_COLORS[em] || '#888'} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={EMOTION_COLORS[em] || '#888'} stopOpacity={0} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid stroke="#1e222d" strokeDasharray="none" vertical={true} horizontal={true} />
                          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#787b86' }} axisLine={{ stroke: '#1e222d' }} tickLine={{ stroke: '#1e222d' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#787b86' }} axisLine={{ stroke: '#1e222d' }} tickLine={{ stroke: '#1e222d' }} unit="%" width={35} />
                          <Tooltip
                            contentStyle={{ background: '#1e222d', border: '1px solid #363a45', borderRadius: '4px', fontSize: '10px', color: '#d1d4dc' }}
                            itemStyle={{ color: '#d1d4dc', fontSize: '10px' }}
                            labelStyle={{ color: '#787b86', fontSize: '9px', marginBottom: '4px' }}
                            cursor={{ stroke: '#363a45', strokeDasharray: '3 3' }}
                          />
                          {allPhotoEmotions.map((em, i) => (
                            <Area
                              key={em}
                              type="monotone"
                              dataKey={em}
                              stroke={EMOTION_COLORS[em] || '#888'}
                              fill={`url(#mg-${em})`}
                              strokeWidth={i === 0 ? 2.5 : 1.5}
                              dot={false}
                              activeDot={{ r: 4, stroke: EMOTION_COLORS[em], fill: '#131722', strokeWidth: 2 }}
                              connectNulls
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Performance comparison bar */}
                    <div className="border-t border-[#1e222d] px-4 py-2">
                      <p className="text-[9px] text-[#787b86] mb-1.5 font-mono">Performance Comparison</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {photoResults.length > 0 && photoResults[photoResults.length - 1].emotions.slice(0, 6).map(e => {
                          const prev = photoResults.length > 1 ? photoResults[photoResults.length - 2].emotions.find(p => p.emotion === e.emotion)?.confidence || 0 : 0;
                          const diff = e.confidence - prev;
                          return (
                            <div key={e.emotion} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EMOTION_COLORS[e.emotion] }} />
                              <span className="text-[10px] font-mono capitalize" style={{ color: EMOTION_COLORS[e.emotion] }}>{e.emotion}</span>
                              <span className="text-[10px] font-mono font-bold" style={{ color: EMOTION_COLORS[e.emotion] }}>{e.confidence}%</span>
                              {photoResults.length > 1 && (
                                <span className={`text-[9px] font-mono ${diff >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                  {diff >= 0 ? '▲' : '▼'}{Math.abs(diff).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <AIInsightsPanel history={history} />
            <AISessionSummary history={history} mode="session-summary" />
            <AISessionSummary history={history} mode="emotion-predict" />
          </div>

          {/* Right Column - Panels & Log */}
          <div className="md:col-span-1 lg:col-span-3 space-y-3 sm:space-y-4 order-2 lg:order-3">
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
