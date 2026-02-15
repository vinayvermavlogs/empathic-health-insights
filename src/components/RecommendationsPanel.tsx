import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendationsPanelProps {
  recommendations: string[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Recommendations
        </h3>
      </div>
      <ul className="space-y-2">
        {recommendations.map((rec, i) => (
          <motion.li
            key={rec}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-2 text-sm text-secondary-foreground"
          >
            <span className="text-primary mt-0.5 shrink-0">›</span>
            <span>{rec}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
