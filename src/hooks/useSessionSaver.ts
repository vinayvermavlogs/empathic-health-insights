import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { EmotionHealthSnapshot } from '@/lib/healthMapping';
import { useToast } from '@/hooks/use-toast';

export function useSessionSaver() {
  const { toast } = useToast();

  const saveSession = useCallback(async (
    history: EmotionHealthSnapshot[],
    durationSeconds: number
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || history.length === 0) return;

    const latest = history[history.length - 1];
    
    // Calculate wellness score
    const h = latest.health;
    const spo2Score = Math.min(100, Math.max(0, (h.oxygenSaturation - 90) * 10));
    const hrvScore = Math.min(100, Math.max(0, h.hrv * 1.5));
    const hrScore = h.heartRate < 60 ? 70 : h.heartRate > 100 ? 30 : 100 - (h.heartRate - 60) * 1.5;
    const cortisolScore = 100 - h.cortisolIndex;
    const wellness = Math.round((spo2Score + hrvScore + hrScore + cortisolScore) / 4);

    const { error } = await supabase.from('session_history').insert({
      user_id: session.user.id,
      dominant_emotion: latest.dominantEmotion,
      emotions: latest.emotions.map(e => ({ emotion: e.emotion, confidence: e.confidence })),
      health_metrics: latest.health,
      wellness_score: wellness,
      session_duration_seconds: durationSeconds,
    });

    if (error) {
      toast({ title: 'Error saving session', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '💾 Session saved!', description: 'View it in your profile.' });
    }
  }, [toast]);

  return { saveSession };
}
