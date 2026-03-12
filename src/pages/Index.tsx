import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Pause, Play, Radio, Sun, Moon, Menu, X, User, Save, LogIn, Bot, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmotionSimulator } from '@/hooks/useEmotionSimulator';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useSessionSaver } from '@/hooks/useSessionSaver';
import { getRecommendations } from '@/lib/healthMapping';
import { EmotionPanel } from '@/components/EmotionPanel';
import { HealthMetricsPanel } from '@/components/HealthMetricsPanel';
import { EmotionTimeline } from '@/components/EmotionTimeline';
import { HealthTimeline } from '@/components/HealthTimeline';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { DetectionLog } from '@/components/DetectionLog';
import { ReportExport } from '@/components/ReportExport';
import { WebcamAnalysis } from '@/components/WebcamAnalysis';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { LiveSubtitles } from '@/components/LiveSubtitles';
import { AISessionSummary } from '@/components/AISessionSummary';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { currentSnapshot, history, isLive, setIsLive } = useEmotionSimulator(2000);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { saveSession } = useSessionSaver();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sessionStartRef = useRef(Date.now());

  const handleSaveSession = () => {
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
    saveSession(history, durationSeconds);
    sessionStartRef.current = Date.now();
  };

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
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">🧠 NeuroSense</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block">Emotion & Health Monitor</p>
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-mono text-muted-foreground hidden md:inline">
              🕐 {currentSnapshot.timestamp.toLocaleTimeString()}
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
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-1.5 text-xs border-border"
            >
              {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
            <ReportExport history={history} sessionId="SESSION-001" />
            <Button variant="outline" size="sm" onClick={() => navigate('/ai-chat')} className="gap-1.5 text-xs border-border">
              <Bot className="w-3 h-3" /> <span className="hidden md:inline">AI Chat</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/architecture')} className="gap-1.5 text-xs border-border">
              <Layers className="w-3 h-3" /> <span className="hidden md:inline">Arch</span>
            </Button>
            {user ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveSession} className="gap-1.5 text-xs border-border">
                  <Save className="w-3 h-3" /> <span className="hidden md:inline">Save</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-1.5 text-xs border-border">
                  <User className="w-3 h-3" /> <span className="hidden md:inline">Profile</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="gap-1.5 text-xs border-border">
                <LogIn className="w-3 h-3" /> <span className="hidden md:inline">Sign In</span>
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden border-t border-border bg-background"
            >
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  🕐 {currentSnapshot.timestamp.toLocaleTimeString()}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsLive(!isLive); setMobileMenuOpen(false); }}
                    className="gap-1.5 text-xs border-border flex-1"
                  >
                    {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isLive ? '⏸️ Pause' : '▶️ Resume'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                    className="gap-1.5 text-xs border-border flex-1"
                  >
                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex-1">
                    <ReportExport history={history} sessionId="SESSION-001" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { navigate('/ai-chat'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border flex-1">
                    <Bot className="w-3 h-3" /> AI Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { navigate('/architecture'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border flex-1">
                    <Layers className="w-3 h-3" /> Architecture
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { handleSaveSession(); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border flex-1">
                        <Save className="w-3 h-3" /> Save Session
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border flex-1">
                        <User className="w-3 h-3" /> Profile
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }} className="gap-1.5 text-xs border-border flex-1">
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
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4"
        >
          {/* Left Column - Webcam */}
          <div className="md:col-span-2 lg:col-span-4 space-y-4 order-1">
            <WebcamAnalysis />
            <LiveSubtitles />
          </div>

          {/* Center Column - Charts & AI */}
          <div className="md:col-span-1 lg:col-span-5 space-y-4 order-3 lg:order-2">
            <AIInsightsPanel history={history} />
            <AISessionSummary history={history} mode="session-summary" />
            <AISessionSummary history={history} mode="emotion-predict" />
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
