import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const MOOD_EMOJIS: Record<string, { emoji: string; label: string }> = {
  happiness: { emoji: '😄', label: 'Happy' },
  stress: { emoji: '😰', label: 'Stressed' },
  anxiety: { emoji: '😟', label: 'Anxious' },
  sadness: { emoji: '😢', label: 'Sad' },
  calmness: { emoji: '😌', label: 'Calm' },
  focus: { emoji: '🧠', label: 'Focused' },
  fatigue: { emoji: '😴', label: 'Tired' },
  neutral: { emoji: '😐', label: 'Neutral' },
};

interface MoodEmojiReactionProps {
  mood: string | null;
  confidence?: number;
}

export function MoodEmojiReaction({ mood, confidence = 0 }: MoodEmojiReactionProps) {
  const [showBurst, setShowBurst] = useState(false);
  const [prevMood, setPrevMood] = useState<string | null>(null);

  useEffect(() => {
    if (mood && mood !== prevMood) {
      setShowBurst(true);
      setPrevMood(mood);
      const t = setTimeout(() => setShowBurst(false), 2000);
      return () => clearTimeout(t);
    }
  }, [mood, prevMood]);

  if (!mood) return null;

  const { emoji, label } = MOOD_EMOJIS[mood] || MOOD_EMOJIS.neutral;

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating particles on mood change */}
      <AnimatePresence>
        {showBurst && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={`particle-${i}`}
                className="absolute text-lg pointer-events-none select-none"
                initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.2,
                  x: (Math.random() - 0.5) * 80,
                  y: -30 - Math.random() * 50,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.08 }}
              >
                {emoji}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main emoji with bounce */}
      <motion.div
        key={mood}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
        className="text-4xl select-none"
      >
        {emoji}
      </motion.div>

      {/* Label */}
      <motion.div
        key={`label-${mood}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 text-xs font-medium text-foreground tracking-wide"
      >
        {label}
        {confidence > 0 && (
          <span className="ml-1 text-muted-foreground font-mono text-[10px]">{confidence}%</span>
        )}
      </motion.div>

      {/* Pulsing ring */}
      <motion.div
        className="absolute -inset-2 rounded-full border-2 border-primary/30"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
