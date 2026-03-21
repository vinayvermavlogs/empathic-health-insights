import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Pause, Play, Sun, Moon, Menu, X, User, Save, LogIn, Bot, Layers, FileText, ImageUp } from 'lucide-react';
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
import logoImg from '@/assets/logo.png';

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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4"
        >
          {/* Left Column - Webcam */}
          <div className="md:col-span-2 lg:col-span-5 space-y-3 sm:space-y-4 order-1">
            <WebcamAnalysis />
            <LiveSubtitles />
          </div>

          {/* Center Column - Charts & AI */}
          <div className="md:col-span-1 lg:col-span-4 space-y-3 sm:space-y-4 order-3 lg:order-2">
            <AIInsightsPanel history={history} />
            <AISessionSummary history={history} mode="session-summary" />
            <AISessionSummary history={history} mode="emotion-predict" />
            <HealthMetricsPanel metrics={currentSnapshot.health} />
            <EmotionTimeline history={history} />
            <HealthTimeline history={history} />
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
