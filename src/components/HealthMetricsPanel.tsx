import { motion } from 'framer-motion';
import { Heart, Activity, Wind, Zap, Gauge, Timer } from 'lucide-react';
import { HealthMetrics, getHealthStatus } from '@/lib/healthMapping';

interface HealthMetricsPanelProps {
  metrics: HealthMetrics;
}

const statusColors = {
  optimal: 'text-success',
  moderate: 'text-primary',
  elevated: 'text-warning',
  critical: 'text-destructive',
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
  delay?: number;
}

function MetricCard({ icon, label, value, unit, color, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="metric-card flex flex-col"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className={`metric-value ${color}`}>{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </motion.div>
  );
}

export function HealthMetricsPanel({ metrics }: HealthMetricsPanelProps) {
  const status = getHealthStatus(metrics);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Health Indicators
        </h3>
        <span className={`text-xs font-mono uppercase ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard
          icon={<Heart className="w-4 h-4" />}
          label="Heart Rate"
          value={metrics.heartRate}
          unit="BPM"
          color={metrics.heartRate > 90 ? 'text-destructive' : metrics.heartRate > 78 ? 'text-warning' : 'text-success'}
          delay={0}
        />
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="HRV"
          value={metrics.hrv}
          unit="ms"
          color={metrics.hrv < 30 ? 'text-destructive' : metrics.hrv < 40 ? 'text-warning' : 'text-success'}
          delay={0.05}
        />
        <MetricCard
          icon={<Gauge className="w-4 h-4" />}
          label="Cortisol"
          value={metrics.cortisolIndex}
          unit="idx"
          color={metrics.cortisolIndex > 60 ? 'text-destructive' : metrics.cortisolIndex > 40 ? 'text-warning' : 'text-success'}
          delay={0.1}
        />
        <MetricCard
          icon={<Zap className="w-4 h-4" />}
          label="SpO₂"
          value={metrics.oxygenSaturation}
          unit="%"
          color={metrics.oxygenSaturation < 95 ? 'text-destructive' : metrics.oxygenSaturation < 97 ? 'text-warning' : 'text-success'}
          delay={0.15}
        />
        <MetricCard
          icon={<Wind className="w-4 h-4" />}
          label="Breathing"
          value={metrics.breathingRate}
          unit="br/min"
          color={metrics.breathingRate > 20 ? 'text-warning' : 'text-success'}
          delay={0.2}
        />
        <MetricCard
          icon={<Timer className="w-4 h-4" />}
          label="Reaction"
          value={metrics.reactionTime}
          unit="ms"
          color={metrics.reactionTime > 350 ? 'text-warning' : 'text-success'}
          delay={0.25}
        />
      </div>
    </div>
  );
}
