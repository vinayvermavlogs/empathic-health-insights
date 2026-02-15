import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmotionHealthSnapshot, getEmotionColor, EmotionType } from '@/lib/healthMapping';

interface EmotionTimelineProps {
  history: EmotionHealthSnapshot[];
}

export function EmotionTimeline({ history }: EmotionTimelineProps) {
  const chartData = useMemo(() => {
    return history.map((snap, i) => {
      const point: Record<string, any> = {
        time: snap.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        index: i,
      };
      for (const e of snap.emotions) {
        point[e.emotion] = e.confidence;
      }
      return point;
    });
  }, [history]);

  const activeEmotions = useMemo(() => {
    const set = new Set<EmotionType>();
    history.forEach(s => s.emotions.forEach(e => set.add(e.emotion)));
    return Array.from(set);
  }, [history]);

  return (
    <div className="chart-container">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Emotion Timeline
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              domain={[0, 100]}
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
            {activeEmotions.map((emotion) => (
              <Area
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stackId="1"
                stroke={getEmotionColor(emotion)}
                fill={getEmotionColor(emotion)}
                fillOpacity={0.3}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
