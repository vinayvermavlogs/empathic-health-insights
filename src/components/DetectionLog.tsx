import { EmotionHealthSnapshot, emotionLabels } from '@/lib/healthMapping';

interface DetectionLogProps {
  history: EmotionHealthSnapshot[];
}

export function DetectionLog({ history }: DetectionLogProps) {
  const recent = [...history].reverse().slice(0, 8);

  return (
    <div className="metric-card overflow-hidden">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Detection Log
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Time</th>
              <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Dominant</th>
              <th className="text-right py-2 pr-3 text-muted-foreground font-medium">HR</th>
              <th className="text-right py-2 pr-3 text-muted-foreground font-medium">HRV</th>
              <th className="text-right py-2 pr-3 text-muted-foreground font-medium">Cortisol</th>
              <th className="text-right py-2 text-muted-foreground font-medium">SpO₂</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((snap, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                  {snap.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="py-1.5 pr-3 text-foreground">
                  {emotionLabels[snap.dominantEmotion]}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono text-foreground">{snap.health.heartRate}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-foreground">{snap.health.hrv}</td>
                <td className="py-1.5 pr-3 text-right font-mono text-foreground">{snap.health.cortisolIndex}</td>
                <td className="py-1.5 text-right font-mono text-foreground">{snap.health.oxygenSaturation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
