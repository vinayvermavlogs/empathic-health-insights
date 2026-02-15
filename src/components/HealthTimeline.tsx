import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmotionHealthSnapshot } from '@/lib/healthMapping';

interface HealthTimelineProps {
  history: EmotionHealthSnapshot[];
}

export function HealthTimeline({ history }: HealthTimelineProps) {
  const chartData = useMemo(() => {
    return history.map((snap) => ({
      time: snap.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      heartRate: snap.health.heartRate,
      hrv: snap.health.hrv,
      cortisol: snap.health.cortisolIndex,
      spo2: snap.health.oxygenSaturation,
    }));
  }, [history]);

  return (
    <div className="chart-container">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Health Trends
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: 'hsl(220, 14%, 18%)' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 10%)',
                border: '1px solid hsl(220, 14%, 18%)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(200, 20%, 92%)',
              }}
            />
            <Line type="monotone" dataKey="heartRate" stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} name="Heart Rate" />
            <Line type="monotone" dataKey="hrv" stroke="hsl(174, 72%, 50%)" strokeWidth={2} dot={false} name="HRV" />
            <Line type="monotone" dataKey="cortisol" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} name="Cortisol" />
            <Line type="monotone" dataKey="spo2" stroke="hsl(152, 69%, 45%)" strokeWidth={2} dot={false} name="SpO₂" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 justify-center">
        {[
          { label: 'Heart Rate', color: 'bg-destructive' },
          { label: 'HRV', color: 'bg-primary' },
          { label: 'Cortisol', color: 'bg-warning' },
          { label: 'SpO₂', color: 'bg-success' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
