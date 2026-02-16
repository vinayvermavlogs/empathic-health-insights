import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EyeAnalysis } from './WebcamAnalysis';

const severityColors: Record<string, string> = {
  none: 'text-green-400',
  healthy: 'text-green-400',
  mild: 'text-yellow-400',
  'mild-concern': 'text-yellow-400',
  moderate: 'text-orange-400',
  severe: 'text-red-400',
  'needs-attention': 'text-red-400',
  normal: 'text-blue-400',
  dilated: 'text-yellow-400',
  constricted: 'text-orange-400',
  dry: 'text-yellow-400',
  watery: 'text-cyan-400',
};

export function EyeAnalysisPanel({ eye }: { eye: EyeAnalysis }) {
  const metrics = [
    { label: 'Strain', value: eye.strain },
    { label: 'Redness', value: eye.redness },
    { label: 'Dark Circles', value: eye.darkCircles },
    { label: 'Moisture', value: eye.moisture },
    { label: 'Pupil', value: eye.pupilDilation },
    { label: 'Health', value: eye.overallHealth },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-md bg-secondary/50 space-y-2"
    >
      <div className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Eye & Retina Analysis</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="text-[10px] text-muted-foreground uppercase">{m.label}</div>
            <div className={`text-xs font-semibold capitalize ${severityColors[m.value] || 'text-foreground'}`}>
              {m.value.replace('-', ' ')}
            </div>
          </div>
        ))}
      </div>

      {eye.retinaObservation && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-0.5">Retina Observation</div>
          <p className="text-xs text-secondary-foreground">{eye.retinaObservation}</p>
        </div>
      )}
    </motion.div>
  );
}
