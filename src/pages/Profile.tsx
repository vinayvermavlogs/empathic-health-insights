import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User, ArrowLeft, LogOut, Activity, Heart, Brain, Trash2,
  Calendar, Clock, TrendingUp, Zap, Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emotionLabels, type EmotionType } from '@/lib/healthMapping';

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

  useEffect(() => {
    loadData();
  }, []);

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
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Stats
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
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <h1 className="text-sm font-semibold text-foreground">👤 My Profile</h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {displayName ? displayName.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={updateProfile} disabled={saving} className="gap-1.5">
                {saving ? 'Saving...' : '💾 Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <Activity className="w-4 h-4" />, label: 'Sessions', value: totalSessions, color: 'text-primary' },
              { icon: <Shield className="w-4 h-4" />, label: 'Avg Wellness', value: `${avgWellness}%`, color: 'text-primary' },
              { icon: <Clock className="w-4 h-4" />, label: 'Total Time', value: formatDuration(totalTime), color: 'text-primary' },
              { icon: <Zap className="w-4 h-4" />, label: 'Top Mood', value: topMood ? `${getEmotionEmoji(topMood[0])} ${topMood[0]}` : '—', color: 'text-primary' },
            ].map((stat, i) => (
              <div key={i} className="metric-card text-center">
                <div className={`${stat.color} mx-auto mb-1`}>{stat.icon}</div>
                <p className="text-lg font-bold text-foreground font-mono">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Session History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                  <p className="text-xs text-muted-foreground">Start a monitoring session from the dashboard to see your history here.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/')} className="gap-1.5 mt-2">
                    <ArrowLeft className="w-3 h-3" /> Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {sessions.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="text-2xl">{getEmotionEmoji(session.dominant_emotion)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground capitalize">
                              {session.dominant_emotion}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                              {session.wellness_score}% wellness
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(session.session_duration_seconds)}
                            </span>
                            {session.health_metrics && (
                              <span className="flex items-center gap-1 hidden sm:flex">
                                <Heart className="w-3 h-3" />
                                {(session.health_metrics as any).heartRate || '—'} BPM
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSession(session.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
