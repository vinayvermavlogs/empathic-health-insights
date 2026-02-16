import { Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import type { GestureSignal } from './WebcamAnalysis';

export function GestureSignalsPanel({ gestures }: { gestures: GestureSignal[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-md bg-secondary/50 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Hand className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gesture Signals</span>
      </div>

      <div className="space-y-1.5">
        {gestures.map((g, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-primary shrink-0 mt-0.5">›</span>
            <div className="flex-1">
              <span className="text-foreground font-medium">{g.gesture}</span>
              <span className="text-muted-foreground"> — {g.meaning}</span>
            </div>
            <span className="font-mono text-muted-foreground text-[10px] shrink-0">{g.confidence}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
