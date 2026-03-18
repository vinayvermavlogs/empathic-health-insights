import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User, ArrowLeft, LogOut, Activity, Heart, Brain, Trash2,
  Calendar, Clock, TrendingUp, Zap, Shield, FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emotionLabels, type EmotionType } from '@/lib/healthMapping';
import logoImg from '@/assets/logo.png';

interface SessionRecord {
  id: string;
  dominant_emotion: string;
  emotions: any;
  health_metrics: any;
  wellness_score: number;
  session_duration_seconds: number;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/auth'); return; }
    const [profileRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('session_history').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
      setDisplayName(profileRes.data.display_name || '');
    }
    if (sessionsRes.data) setSessions(sessionsRes.data as SessionRecord[]);
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName, updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Profile updated!' });
    setSaving(false);
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('session_history').delete().eq('id', id);
    if (!error) {
      setSessions(s => s.filter(x => x.id !== id));
      toast({ title: '🗑️ Session deleted' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getEmotionEmoji = (emotion: string): string => {
    const e = emotionLabels[emotion as EmotionType];
    return e ? e.split(' ')[0] : '🔵';
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getSessionGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 60) return { grade: 'B', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    if (score >= 40) return { grade: 'C', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { grade: 'D', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const totalSessions = sessions.length;
  const avgWellness = totalSessions > 0 ? Math.round(sessions.reduce((a, s) => a + s.wellness_score, 0) / totalSessions) : 0;
  const totalTime = sessions.reduce((a, s) => a + s.session_duration_seconds, 0);
  const moodCounts: Record<string, number> = {};
  sessions.forEach(s => { moodCounts[s.dominant_emotion] = (moodCounts[s.dominant_emotion] || 0) + 1; });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
        <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="w-6 h-6 rounded-md" />
            <h1 className="text-sm font-semibold text-foreground">My Profile</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-5">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {displayName ? displayName.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="flex-1 space-y-2">
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" className="text-sm" />
                  <p className="text-[10px] text-muted-foreground">
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <Button size="sm" onClick={updateProfile} disabled={saving} className="gap-1.5 shrink-0">
                  {saving ? 'Saving...' : '💾 Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: <Activity className="w-4 h-4" />, label: 'Sessions', value: totalSessions },
              { icon: <Shield className="w-4 h-4" />, label: 'Avg Wellness', value: `${avgWellness}%` },
              { icon: <Clock className="w-4 h-4" />, label: 'Total Time', value: formatDuration(totalTime) },
              { icon: <Zap className="w-4 h-4" />, label: 'Top Mood', value: topMood ? `${getEmotionEmoji(topMood[0])} ${topMood[0]}` : '—' },
            ].map((stat, i) => (
              <div key={i} className="metric-card text-center">
                <div className="text-primary mx-auto mb-1">{stat.icon}</div>
                <p className="text-base sm:text-lg font-bold text-foreground font-mono">{stat.value}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Session History as Report Cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Session Reports
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/mental-health-card')} className="gap-1.5 text-xs">
              <FileText className="w-3 h-3" /> Health Card
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1.5 mt-2">
                  <ArrowLeft className="w-3 h-3" /> Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence>
                {sessions.map((session, i) => {
                  const grade = getSessionGrade(session.wellness_score);
                  const emotions = session.emotions as any[];
                  const health = session.health_metrics as any;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="session-report-card group hover:shadow-lg transition-all duration-200 overflow-hidden">
                        {/* Card accent */}
                        <div className="h-1 bg-primary" />
                        <CardContent className="p-3 sm:p-4 space-y-3">
                          {/* Header row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="text-2xl">{getEmotionEmoji(session.dominant_emotion)}</div>
                              <div>
                                <p className="text-sm font-semibold text-foreground capitalize">{session.dominant_emotion}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(session.created_at).toLocaleDateString()}</span>
                                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatDuration(session.session_duration_seconds)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-10 h-10 rounded-lg ${grade.bg} flex items-center justify-center`}>
                                <span className={`text-lg font-bold ${grade.color}`}>{grade.grade}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSession(session.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Wellness bar */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground">Wellness</span>
                              <span className="font-mono font-bold text-foreground">{session.wellness_score}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${session.wellness_score}%` }} />
                            </div>
                          </div>

                          {/* Health Metrics */}
                          {health && (
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { label: 'HR', value: health.heartRate, unit: 'BPM' },
                                { label: 'SpO₂', value: health.oxygenSaturation, unit: '%' },
                                { label: 'HRV', value: health.hrv, unit: 'ms' },
                              ].map(m => (
                                <div key={m.label} className="text-center p-1.5 rounded bg-secondary/40">
                                  <p className="text-[10px] font-bold text-foreground font-mono">{m.value || '—'}<span className="text-[8px] text-muted-foreground ml-0.5">{m.unit}</span></p>
                                  <p className="text-[8px] text-muted-foreground">{m.label}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Emotion percentages */}
                          {Array.isArray(emotions) && emotions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {emotions.slice(0, 4).map((e: any, j: number) => (
                                <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                                  {emotionLabels[e.emotion as EmotionType]?.split(' ')[0] || '🔵'} {e.confidence}%
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
