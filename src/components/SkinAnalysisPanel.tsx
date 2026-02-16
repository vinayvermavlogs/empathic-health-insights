import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SkinAnalysis } from './WebcamAnalysis';

const conditionColors: Record<string, string> = {
  excellent: 'text-green-400',
  good: 'text-emerald-400',
  fair: 'text-yellow-400',
  poor: 'text-red-400',
};

const hydrationColors: Record<string, string> = {
  'well-hydrated': 'text-cyan-400',
  normal: 'text-blue-400',
  dry: 'text-yellow-400',
  'very-dry': 'text-red-400',
};

export function SkinAnalysisPanel({ skin }: { skin: SkinAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-md bg-secondary/50 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Skin Analysis</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Condition</div>
          <div className={`text-xs font-semibold capitalize ${conditionColors[skin.condition] || 'text-foreground'}`}>
            {skin.condition}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Hydration</div>
          <div className={`text-xs font-semibold capitalize ${hydrationColors[skin.hydration] || 'text-foreground'}`}>
            {skin.hydration.replace('-', ' ')}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Tone</div>
          <div className="text-xs text-secondary-foreground capitalize">{skin.skinTone}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase">Score</div>
          <div className="text-xs font-mono text-foreground">{skin.overallScore}/100</div>
        </div>
      </div>

      {skin.concerns.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1">Concerns</div>
          <div className="flex flex-wrap gap-1">
            {skin.concerns.map((c, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
