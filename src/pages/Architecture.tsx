import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Layers, Network, Database, Code2, Cpu,
  ArrowRight, Shield, Zap, Globe, Server, Monitor
} from 'lucide-react';

const flowSteps = [
  { icon: <Monitor className="w-5 h-5" />, label: 'Webcam Feed', desc: 'Browser captures video frames via getUserMedia API', color: 'text-blue-500' },
  { icon: <Globe className="w-5 h-5" />, label: 'Frame Extraction', desc: 'Canvas API converts frames to base64 JPEG for analysis', color: 'text-cyan-500' },
  { icon: <Server className="w-5 h-5" />, label: 'Edge Function', desc: 'analyze-face function processes image via Gemini Vision API', color: 'text-purple-500' },
  { icon: <Cpu className="w-5 h-5" />, label: 'AI Processing', desc: 'Google Gemini detects emotions, skin health, eye analysis', color: 'text-pink-500' },
  { icon: <Database className="w-5 h-5" />, label: 'Data Pipeline', desc: 'Results mapped to health metrics via healthMapping.ts', color: 'text-green-500' },
  { icon: <Zap className="w-5 h-5" />, label: 'Real-time UI', desc: 'React state updates drive live dashboard visualization', color: 'text-yellow-500' },
];

const hldComponents = [
  {
    title: 'Presentation Layer',
    items: ['React 18 + Vite', 'Tailwind CSS + shadcn/ui', 'Framer Motion animations', 'Recharts data viz', 'Responsive grid layout'],
    color: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    title: 'Application Layer',
    items: ['Emotion Simulator Engine', 'Health Metrics Calculator', 'Speech Recognition API', 'Session Management', 'Theme System'],
    color: 'bg-purple-500/10 border-purple-500/30',
  },
  {
    title: 'AI / ML Layer',
    items: ['Google Gemini 3 Flash', 'Lovable AI Gateway', 'Face emotion detection', 'Skin & eye analysis', 'NLP health chat'],
    color: 'bg-pink-500/10 border-pink-500/30',
  },
  {
    title: 'Backend Layer',
    items: ['Supabase PostgreSQL', 'Edge Functions (Deno)', 'Row Level Security', 'Auth with JWT', 'Real-time subscriptions'],
    color: 'bg-green-500/10 border-green-500/30',
  },
];

const lldModules = [
  {
    module: 'useEmotionSimulator',
    type: 'Hook',
    desc: 'Core engine generating EmotionHealthSnapshot objects at configurable intervals. Maps random emotion weights to physiological metrics via healthMapping.ts.',
    inputs: ['intervalMs: number'],
    outputs: ['currentSnapshot', 'history[]', 'isLive', 'setIsLive'],
  },
  {
    module: 'WebcamAnalysis',
    type: 'Component',
    desc: 'Captures webcam frames, sends to analyze-face edge function. Processes Gemini response to extract emotions, skin data, eye metrics, and gestures.',
    inputs: ['getUserMedia stream'],
    outputs: ['FaceAnalysis JSON', 'UI overlays'],
  },
  {
    module: 'healthMapping.ts',
    type: 'Utility',
    desc: 'Maps EmotionType → HealthMetrics with physiological correlations. Includes wellness score calculation (SpO2, HRV, HR, cortisol composite).',
    inputs: ['EmotionType', 'HealthMetrics'],
    outputs: ['EmotionHealthSnapshot', 'Recommendations[]'],
  },
  {
    module: 'health-chat',
    type: 'Edge Function',
    desc: 'Multi-mode AI endpoint. Supports chat, session-summary, emotion-predict, skin-eye-diagnosis modes with specialized system prompts.',
    inputs: ['messages[]', 'mode: string'],
    outputs: ['SSE token stream'],
  },
  {
    module: 'useSessionSaver',
    type: 'Hook',
    desc: 'Persists monitoring sessions to session_history table. Calculates composite wellness score from SpO2, HRV, heart rate, cortisol.',
    inputs: ['EmotionHealthSnapshot[]', 'durationSeconds'],
    outputs: ['Supabase insert result'],
  },
  {
    module: 'LiveSubtitles',
    type: 'Component',
    desc: 'Web Speech API integration for real-time transcription. Supports 8 languages, text-to-speech playback, word counting.',
    inputs: ['SpeechRecognition events'],
    outputs: ['Transcript text', 'Stats'],
  },
];

const apiEndpoints = [
  { method: 'POST', path: '/functions/v1/analyze-face', desc: 'Send base64 image for AI facial analysis', auth: 'Anon key', response: 'JSON: emotions, skin, eyes, gestures' },
  { method: 'POST', path: '/functions/v1/health-chat', desc: 'AI health chat with streaming responses', auth: 'Anon key', response: 'SSE stream: chat completions' },
  { method: 'GET', path: '/rest/v1/profiles', desc: 'Fetch user profile data', auth: 'JWT + RLS', response: 'JSON: profile object' },
  { method: 'PATCH', path: '/rest/v1/profiles', desc: 'Update display name / avatar', auth: 'JWT + RLS', response: 'JSON: updated profile' },
  { method: 'GET', path: '/rest/v1/session_history', desc: 'Fetch past monitoring sessions', auth: 'JWT + RLS', response: 'JSON: session array' },
  { method: 'POST', path: '/rest/v1/session_history', desc: 'Save a monitoring session', auth: 'JWT + RLS', response: 'JSON: created session' },
  { method: 'DELETE', path: '/rest/v1/session_history', desc: 'Delete a session record', auth: 'JWT + RLS', response: '204 No Content' },
];

const Architecture = () => {
  const navigate = useNavigate();
  const [activeFlow, setActiveFlow] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">📐 System Architecture</h1>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="dataflow" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-xl mx-auto">
            <TabsTrigger value="dataflow" className="text-xs gap-1"><Network className="w-3 h-3" /> Data Flow</TabsTrigger>
            <TabsTrigger value="hld" className="text-xs gap-1"><Layers className="w-3 h-3" /> HLD</TabsTrigger>
            <TabsTrigger value="lld" className="text-xs gap-1"><Code2 className="w-3 h-3" /> LLD</TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1"><Shield className="w-3 h-3" /> API Docs</TabsTrigger>
          </TabsList>

          {/* Data Flow Visualization */}
          <TabsContent value="dataflow">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-foreground">🔄 Real-Time Data Pipeline</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Live visualization of how data flows from webcam capture through AI analysis to the dashboard
                </p>
              </div>

              {/* Animated Flow */}
              <div className="flex flex-col items-center gap-1">
                {flowSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="w-full max-w-lg"
                  >
                    <div
                      onClick={() => setActiveFlow(i)}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        activeFlow === i ? 'bg-primary/10 ring-1 ring-primary/30 scale-[1.02]' : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      <div className={`${step.color} p-2 rounded-lg bg-background`}>{step.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Step {i + 1}
                      </span>
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <motion.div
                          animate={{ y: [0, 4, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                        >
                          <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Tech Stack */}
              <Card className="max-w-lg mx-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">⚡ Technology Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Recharts',
                      'Supabase', 'Deno', 'Google Gemini', 'Web Speech API', 'PostgreSQL', 'shadcn/ui'].map(t => (
                      <span key={t} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* HLD */}
          <TabsContent value="hld">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-foreground">🏗️ High-Level Design</h2>
                <p className="text-xs text-muted-foreground">Layered architecture overview</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {hldComponents.map((comp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`${comp.color} border`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{comp.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {comp.items.map((item, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Security */}
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" /> Security Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    'Row Level Security (RLS) on all user data tables',
                    'JWT-based authentication via Supabase Auth',
                    'Edge Functions with CORS headers and input validation',
                    'API keys stored as encrypted Supabase secrets',
                    'User data isolation — users can only access own records',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3 text-green-500 shrink-0" />
                      {s}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LLD */}
          <TabsContent value="lld">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-foreground">🔧 Low-Level Design</h2>
                <p className="text-xs text-muted-foreground">Module-level architecture with I/O contracts</p>
              </div>

              <div className="space-y-3 max-w-3xl mx-auto">
                {lldModules.map((mod, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold font-mono text-foreground">{mod.module}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                            {mod.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mod.desc}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Inputs</p>
                            {mod.inputs.map((inp, j) => (
                              <p key={j} className="text-[11px] font-mono text-foreground/80">→ {inp}</p>
                            ))}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Outputs</p>
                            {mod.outputs.map((out, j) => (
                              <p key={j} className="text-[11px] font-mono text-foreground/80">← {out}</p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* DB Schema */}
              <Card className="max-w-3xl mx-auto">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Database Schema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      table: 'profiles',
                      cols: ['id (uuid, PK)', 'display_name (text)', 'avatar_url (text)', 'created_at (timestamptz)', 'updated_at (timestamptz)'],
                      rls: 'SELECT/UPDATE/INSERT own rows only',
                    },
                    {
                      table: 'session_history',
                      cols: ['id (uuid, PK)', 'user_id (uuid, FK)', 'dominant_emotion (text)', 'emotions (jsonb)', 'health_metrics (jsonb)', 'wellness_score (int)', 'session_duration_seconds (int)', 'created_at (timestamptz)'],
                      rls: 'SELECT/INSERT/DELETE own rows only',
                    },
                  ].map((t, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-semibold font-mono text-foreground">📋 {t.table}</p>
                      <div className="pl-4 space-y-0.5">
                        {t.cols.map((c, j) => (
                          <p key={j} className="text-[11px] font-mono text-muted-foreground">{c}</p>
                        ))}
                      </div>
                      <p className="text-[10px] text-primary pl-4">🔒 RLS: {t.rls}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Docs */}
          <TabsContent value="api">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-foreground">📡 API Documentation</h2>
                <p className="text-xs text-muted-foreground">All endpoints with auth requirements</p>
              </div>

              <div className="space-y-3 max-w-3xl mx-auto">
                {apiEndpoints.map((ep, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                            ep.method === 'GET' ? 'bg-green-500/10 text-green-500' :
                            ep.method === 'POST' ? 'bg-blue-500/10 text-blue-500' :
                            ep.method === 'PATCH' ? 'bg-yellow-500/10 text-yellow-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {ep.method}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-mono text-foreground">{ep.path}</p>
                            <p className="text-xs text-muted-foreground">{ep.desc}</p>
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[10px] text-muted-foreground">
                                🔑 {ep.auth}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                📤 {ep.response}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Architecture;
