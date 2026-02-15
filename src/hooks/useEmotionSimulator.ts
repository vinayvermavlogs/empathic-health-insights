import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  EmotionType, EmotionReading, EmotionHealthSnapshot,
  mapEmotionsToHealth 
} from '@/lib/healthMapping';

const EMOTIONS: EmotionType[] = ['happiness', 'stress', 'anxiety', 'sadness', 'calmness', 'focus', 'fatigue', 'neutral'];

function randomEmotions(): EmotionReading[] {
  // Pick 3-5 emotions with random confidences
  const count = 3 + Math.floor(Math.random() * 3);
  const shuffled = [...EMOTIONS].sort(() => Math.random() - 0.5).slice(0, count);
  
  let remaining = 100;
  const readings: EmotionReading[] = shuffled.map((emotion, i) => {
    const isLast = i === shuffled.length - 1;
    const confidence = isLast ? remaining : Math.min(remaining, Math.floor(Math.random() * (remaining * 0.6)) + 5);
    remaining -= confidence;
    return { emotion, confidence, timestamp: new Date() };
  });

  return readings.sort((a, b) => b.confidence - a.confidence);
}

function blendEmotions(prev: EmotionReading[], next: EmotionReading[], alpha: number): EmotionReading[] {
  const map = new Map<EmotionType, number>();
  for (const e of prev) map.set(e.emotion, (map.get(e.emotion) ?? 0) + e.confidence * (1 - alpha));
  for (const e of next) map.set(e.emotion, (map.get(e.emotion) ?? 0) + e.confidence * alpha);

  return Array.from(map.entries())
    .map(([emotion, confidence]) => ({ emotion, confidence: Math.round(confidence), timestamp: new Date() }))
    .filter(e => e.confidence > 2)
    .sort((a, b) => b.confidence - a.confidence);
}

export function useEmotionSimulator(intervalMs = 2000) {
  const [currentSnapshot, setCurrentSnapshot] = useState<EmotionHealthSnapshot | null>(null);
  const [history, setHistory] = useState<EmotionHealthSnapshot[]>([]);
  const [isLive, setIsLive] = useState(true);
  const targetRef = useRef<EmotionReading[]>(randomEmotions());
  const currentRef = useRef<EmotionReading[]>(randomEmotions());

  const generateSnapshot = useCallback(() => {
    // Gradually shift toward target
    currentRef.current = blendEmotions(currentRef.current, targetRef.current, 0.3);
    const emotions = currentRef.current;
    const health = mapEmotionsToHealth(emotions);
    const dominant = emotions[0]?.emotion ?? 'neutral';

    const snapshot: EmotionHealthSnapshot = {
      emotions,
      health,
      timestamp: new Date(),
      dominantEmotion: dominant,
    };

    setCurrentSnapshot(snapshot);
    setHistory(prev => [...prev.slice(-59), snapshot]); // keep last 60
  }, []);

  useEffect(() => {
    if (!isLive) return;
    generateSnapshot(); // initial
    const interval = setInterval(generateSnapshot, intervalMs);
    // Change target emotion profile every 8-12 seconds
    const targetInterval = setInterval(() => {
      targetRef.current = randomEmotions();
    }, 8000 + Math.random() * 4000);

    return () => {
      clearInterval(interval);
      clearInterval(targetInterval);
    };
  }, [isLive, intervalMs, generateSnapshot]);

  return { currentSnapshot, history, isLive, setIsLive };
}
