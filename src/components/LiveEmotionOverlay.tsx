import { motion, AnimatePresence } from 'framer-motion';
import { getEmotionColor, emotionLabels, type EmotionType } from '@/lib/healthMapping';

interface LiveEmotionOverlayProps {
  emotions: { emotion: EmotionType; confidence: number }[];
  isVisible: boolean;
}

export function LiveEmotionOverlay({ emotions, isVisible }: LiveEmotionOverlayProps) {
  if (!isVisible || !emotions.length) return null;

  const top3 = emotions.slice(0, 4);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap gap-1.5"
      >
        {top3.map((e, i) => {
          const label = emotionLabels[e.emotion] || e.emotion;
          const emoji = label.split(' ')[0];
          const name = label.split(' ').slice(1).join(' ') || e.emotion;

          return (
            <motion.div
              key={e.emotion}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="emotion-overlay-pill"
            >
              <span className="text-sm">{emoji}</span>
              <span className="capitalize">{name}</span>
              <span
                className="font-mono font-semibold tabular-nums"
                style={{ color: getEmotionColor(e.emotion) }}
              >
                {e.confidence}%
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
