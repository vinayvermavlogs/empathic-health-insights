import { motion } from 'framer-motion';
import { EmotionReading, getEmotionColor, emotionLabels } from '@/lib/healthMapping';

interface EmotionPanelProps {
  emotions: EmotionReading[];
  dominantEmotion: string;
}

export function EmotionPanel({ emotions, dominantEmotion }: EmotionPanelProps) {
  return (
    <div className="metric-card">
      <div className="scan-line" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Emotion Analysis
        </h3>
        <span className="status-live">
          <span className="pulse-dot bg-success" />
          Live
        </span>
      </div>

      <div className="mb-6 text-center">
        <motion.div
          key={dominantEmotion}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl mb-1"
        >
          {emotionLabels[dominantEmotion as keyof typeof emotionLabels]?.split(' ')[0]}
        </motion.div>
        <p className="text-sm text-muted-foreground">
          Dominant: <span className="text-foreground font-medium capitalize">{dominantEmotion}</span>
        </p>
      </div>

      <div className="space-y-3">
        {emotions.map((e) => (
          <div key={e.emotion} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-secondary-foreground">
                {emotionLabels[e.emotion]}
              </span>
              <span className="font-mono text-muted-foreground">{e.confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getEmotionColor(e.emotion) }}
                initial={{ width: 0 }}
                animate={{ width: `${e.confidence}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
