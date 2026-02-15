export type EmotionType = 
  | 'happiness' | 'stress' | 'anxiety' | 'sadness' 
  | 'calmness' | 'focus' | 'fatigue' | 'neutral';

export interface EmotionReading {
  emotion: EmotionType;
  confidence: number; // 0-100
  timestamp: Date;
}

export interface HealthMetrics {
  heartRate: number; // BPM
  hrv: number; // ms
  cortisolIndex: number; // 0-100 normalized
  oxygenSaturation: number; // %
  breathingRate: number; // breaths/min
  reactionTime: number; // ms
}

export interface EmotionHealthSnapshot {
  emotions: EmotionReading[];
  health: HealthMetrics;
  timestamp: Date;
  dominantEmotion: EmotionType;
}

const emotionColors: Record<EmotionType, string> = {
  happiness: 'hsl(152, 69%, 45%)',
  stress: 'hsl(0, 72%, 55%)',
  anxiety: 'hsl(38, 92%, 55%)',
  sadness: 'hsl(210, 72%, 55%)',
  calmness: 'hsl(174, 72%, 50%)',
  focus: 'hsl(265, 60%, 55%)',
  fatigue: 'hsl(220, 14%, 50%)',
  neutral: 'hsl(200, 20%, 60%)',
};

export const getEmotionColor = (emotion: EmotionType): string => emotionColors[emotion];

export const emotionLabels: Record<EmotionType, string> = {
  happiness: '😊 Happiness',
  stress: '😰 Stress',
  anxiety: '😟 Anxiety',
  sadness: '😢 Sadness',
  calmness: '😌 Calmness',
  focus: '🎯 Focus',
  fatigue: '😴 Fatigue',
  neutral: '😐 Neutral',
};

// Maps emotion intensities to approximate health metrics
export function mapEmotionsToHealth(emotions: EmotionReading[]): HealthMetrics {
  const weights: Record<EmotionType, Partial<HealthMetrics>> = {
    happiness: { heartRate: 72, hrv: 55, cortisolIndex: 20, oxygenSaturation: 98, breathingRate: 14, reactionTime: 220 },
    stress: { heartRate: 95, hrv: 28, cortisolIndex: 78, oxygenSaturation: 96, breathingRate: 20, reactionTime: 180 },
    anxiety: { heartRate: 90, hrv: 30, cortisolIndex: 70, oxygenSaturation: 96, breathingRate: 22, reactionTime: 200 },
    sadness: { heartRate: 65, hrv: 40, cortisolIndex: 45, oxygenSaturation: 97, breathingRate: 13, reactionTime: 320 },
    calmness: { heartRate: 62, hrv: 65, cortisolIndex: 15, oxygenSaturation: 99, breathingRate: 12, reactionTime: 250 },
    focus: { heartRate: 70, hrv: 50, cortisolIndex: 30, oxygenSaturation: 98, breathingRate: 15, reactionTime: 160 },
    fatigue: { heartRate: 68, hrv: 35, cortisolIndex: 55, oxygenSaturation: 95, breathingRate: 16, reactionTime: 400 },
    neutral: { heartRate: 72, hrv: 45, cortisolIndex: 30, oxygenSaturation: 98, breathingRate: 15, reactionTime: 250 },
  };

  let totalWeight = 0;
  const result: HealthMetrics = { heartRate: 0, hrv: 0, cortisolIndex: 0, oxygenSaturation: 0, breathingRate: 0, reactionTime: 0 };

  for (const e of emotions) {
    const w = e.confidence / 100;
    totalWeight += w;
    const mapped = weights[e.emotion];
    result.heartRate += (mapped.heartRate ?? 72) * w;
    result.hrv += (mapped.hrv ?? 45) * w;
    result.cortisolIndex += (mapped.cortisolIndex ?? 30) * w;
    result.oxygenSaturation += (mapped.oxygenSaturation ?? 98) * w;
    result.breathingRate += (mapped.breathingRate ?? 15) * w;
    result.reactionTime += (mapped.reactionTime ?? 250) * w;
  }

  if (totalWeight > 0) {
    result.heartRate = Math.round(result.heartRate / totalWeight);
    result.hrv = Math.round(result.hrv / totalWeight);
    result.cortisolIndex = Math.round(result.cortisolIndex / totalWeight);
    result.oxygenSaturation = Math.round((result.oxygenSaturation / totalWeight) * 10) / 10;
    result.breathingRate = Math.round(result.breathingRate / totalWeight);
    result.reactionTime = Math.round(result.reactionTime / totalWeight);
  }

  return result;
}

export function getHealthStatus(metrics: HealthMetrics): 'optimal' | 'moderate' | 'elevated' | 'critical' {
  if (metrics.cortisolIndex > 70 || metrics.heartRate > 100 || metrics.oxygenSaturation < 94) return 'critical';
  if (metrics.cortisolIndex > 50 || metrics.heartRate > 85 || metrics.oxygenSaturation < 96) return 'elevated';
  if (metrics.cortisolIndex > 35 || metrics.heartRate > 78) return 'moderate';
  return 'optimal';
}

export function getRecommendations(dominant: EmotionType, metrics: HealthMetrics): string[] {
  const recs: string[] = [];
  if (metrics.cortisolIndex > 50) recs.push('Practice deep breathing exercises (4-7-8 technique) to lower cortisol levels.');
  if (metrics.heartRate > 85) recs.push('Consider a 5-minute guided meditation to reduce heart rate.');
  if (dominant === 'stress' || dominant === 'anxiety') recs.push('Take a short walk or do progressive muscle relaxation.');
  if (dominant === 'fatigue') recs.push('Ensure 7-9 hours of sleep tonight. Consider a 20-minute power nap.');
  if (dominant === 'sadness') recs.push('Connect with someone you trust. Physical activity can boost mood.');
  if (metrics.oxygenSaturation < 96) recs.push('Practice deep diaphragmatic breathing to improve oxygen levels.');
  if (metrics.hrv < 35) recs.push('Heart rate variability is low. Prioritize rest and stress reduction.');
  if (recs.length === 0) recs.push('Your readings are within healthy ranges. Keep up your current wellness practices!');
  return recs;
}
