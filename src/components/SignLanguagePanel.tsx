import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, MessageCircle } from 'lucide-react';
import signLangRef from '@/assets/sign-language-reference.jpg';

// Map ASL letters to messages
export const LETTER_MESSAGES: Record<string, string> = {
  a: '👋 Hello!',
  b: '👋 Bye, see you soon!',
  c: '📞 Call me!',
  d: '🎉 Great job, well done!',
  e: '🚨 Emergency! Need help!',
  f: '🤝 Friends forever!',
  g: '👍 Good to go!',
  h: '🏠 Going home!',
  i: '💡 I have an idea!',
  j: '😊 Just happy!',
  k: '😘 Sending a kiss!',
  l: '❤️ Love you!',
  m: '🌅 Good morning!',
  n: '🌙 Good night!',
  o: '👌 OK, got it!',
  p: '🙏 Please!',
  q: '❓ I have a question!',
  r: '🏃 Ready to go!',
  s: '🤫 Shhh, be quiet!',
  t: '🙏 Thank you!',
  u: '☝️ You! Yes, you!',
  v: '✌️ Victory / Peace!',
  w: '👋 Welcome!',
  x: '❌ No / Stop!',
  y: '🤙 Yes! / Hang loose!',
  z: '💤 Sleepy / Zzz...',
};

export interface SignLanguageDetection {
  letter: string | null;
  confidence: number;
}

interface Props {
  detection: SignLanguageDetection | null;
  detectedLetters: string[];
}

export function SignLanguagePanel({ detection, detectedLetters }: Props) {
  const message = detection?.letter ? LETTER_MESSAGES[detection.letter.toLowerCase()] : null;
  const [showRef, setShowRef] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-md bg-secondary/50 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Hand className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sign Language</span>
        </div>
        <button
          onClick={() => setShowRef(!showRef)}
          className="text-[10px] text-primary hover:underline"
        >
          {showRef ? 'Hide' : 'Show'} Reference
        </button>
      </div>

      {/* Detected Letter */}
      <AnimatePresence mode="wait">
        {detection?.letter && (
          <motion.div
            key={detection.letter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary uppercase">{detection.letter}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3 h-3 text-primary" />
                <span className="text-sm font-semibold text-foreground">{message}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                Confidence: {detection.confidence}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!detection?.letter && (
        <p className="text-xs text-muted-foreground italic">No sign language letter detected. Show a hand sign to the camera!</p>
      )}

      {/* Recent detected letters */}
      {detectedLetters.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Signs</span>
          <div className="flex flex-wrap gap-1">
            {detectedLetters.map((l, i) => (
              <span
                key={i}
                className="w-6 h-6 rounded bg-primary/15 text-primary text-xs font-bold flex items-center justify-center uppercase"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Letter → Message Reference */}
      {showRef && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <img src={signLangRef} alt="ASL Sign Language Reference" className="w-full rounded-md" />
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
            {Object.entries(LETTER_MESSAGES).map(([letter, msg]) => (
              <div key={letter} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-4 h-4 rounded bg-primary/10 text-primary font-bold flex items-center justify-center uppercase text-[9px]">{letter}</span>
                <span className="text-muted-foreground truncate">{msg}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
