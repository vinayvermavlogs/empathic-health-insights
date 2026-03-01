import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import type { EmotionHealthSnapshot } from '@/lib/healthMapping';

interface AIInsightsPanelProps {
  history: EmotionHealthSnapshot[];
}

export function AIInsightsPanel({ history }: AIInsightsPanelProps) {
  if (history.length < 3) return null;

  // Compute mood streak
  const recent = history.slice(-10);
  const moodCounts: Record<string, number> = {};
  recent.forEach(s => {
    moodCounts[s.dominantEmotion] = (moodCounts[s.dominantEmotion] || 0) + 1;
  });
  const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const streakPct = Math.round((dominant[1] / recent.length) * 100);

  // Wellness score (0-100)
  const lastHealth = history[history.length - 1]?.health;
  const wellness = lastHealth
    ? Math.round(
        Math.min(100, Math.max(0,
          (lastHealth.oxygenSaturation - 90) * 10 +
          (lastHealth.hrv > 40 ? 30 : lastHealth.hrv * 0.75) +
          (lastHealth.heartRate < 100 ? 30 : 10) +
          (lastHealth.cortisolIndex < 60 ? 20 : 5)
        ))
      )
    : 0;

  const wellnessColor = wellness > 70 ? 'text-green-500' : wellness > 40 ? 'text-yellow-500' : 'text-red-500';

  const insights = [
    {
      icon: TrendingUp,
      title: 'Mood Streak',
      value: `${dominant[0]} ${streakPct}%`,
      desc: `Dominant mood in last ${recent.length} readings`,
    },
    {
      icon: Shield,
      title: 'Wellness Score',
      value: `${wellness}/100`,
      desc: wellness > 70 ? 'Great condition! 🌟' : wellness > 40 ? 'Moderate — take a break 🧘' : 'Needs attention ⚠️',
      color: wellnessColor,
    },
    {
      icon: Zap,
      title: 'Session Stats',
      value: `${history.length}`,
      desc: 'Total readings this session',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="metric-card"
    >
      <div className="scan-line" />
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          AI Insights ✨
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-2 rounded-md bg-secondary/30"
          >
            <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase">{item.title}</span>
                <span className={`font-mono text-sm font-semibold ${item.color || 'text-foreground'}`}>
                  {item.value}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
