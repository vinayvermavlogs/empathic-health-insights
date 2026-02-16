import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  message: string | null;
  blinkCount: number;
}

export function BlinkSignalBanner({ message, blinkCount }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="mb-3 p-3 rounded-lg bg-primary/20 border border-primary/40 text-center"
        >
          <p className="text-sm font-semibold text-primary">{message}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Detected via {blinkCount}× blink signal</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
