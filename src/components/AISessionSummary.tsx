import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EmotionHealthSnapshot } from '@/lib/healthMapping';
import ReactMarkdown from 'react-markdown';

interface Props {
  history: EmotionHealthSnapshot[];
  mode?: 'session-summary' | 'emotion-predict';
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

export const AISessionSummary = ({ history, mode = 'session-summary' }: Props) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (history.length === 0) {
      toast({ title: 'No data', description: 'Start monitoring to generate a summary.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setSummary('');

    const dataPrompt = mode === 'emotion-predict'
      ? `Analyze these ${history.length} data points and predict future trends:\n${JSON.stringify(history.slice(-20).map(h => ({
          emotion: h.dominantEmotion,
          hr: h.health.heartRate,
          hrv: h.health.hrv,
          spo2: h.health.oxygenSaturation,
          cortisol: h.health.cortisolIndex,
          time: h.timestamp.toISOString(),
        })))}`
      : `Generate a clinical summary for this monitoring session (${history.length} snapshots):\n${JSON.stringify(history.slice(-20).map(h => ({
          emotion: h.dominantEmotion,
          confidence: h.emotions[0]?.confidence,
          hr: h.health.heartRate,
          hrv: h.health.hrv,
          spo2: h.health.oxygenSaturation,
          cortisol: h.health.cortisolIndex,
          breathing: h.health.breathingRate,
          time: h.timestamp.toISOString(),
        })))}`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: dataPrompt }],
          mode,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI request failed');
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const content = JSON.parse(json).choices?.[0]?.delta?.content;
            if (content) {
              text += content;
              setSummary(text);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-1.5">
            {mode === 'emotion-predict' ? (
              <><TrendingUp className="w-3.5 h-3.5 text-primary" /> AI Mood Predictor</>
            ) : (
              <><FileText className="w-3.5 h-3.5 text-primary" /> AI Session Summary</>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={generate} disabled={loading} className="text-[10px] gap-1 h-7">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-sm dark:prose-invert max-w-none text-xs max-h-64 overflow-y-auto [&>*:first-child]:mt-0"
          >
            <ReactMarkdown>{summary}</ReactMarkdown>
          </motion.div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {mode === 'emotion-predict'
                ? 'Click Generate to predict emotional trends from session data.'
                : 'Click Generate to create an AI-powered clinical summary.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
