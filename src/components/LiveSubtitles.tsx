import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Copy, Trash2, Volume2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface TranscriptEntry {
  id: number;
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

// Extend window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function LiveSubtitles() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [language, setLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const idCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en-US', label: '🇺🇸 English' },
    { code: 'hi-IN', label: '🇮🇳 Hindi' },
    { code: 'es-ES', label: '🇪🇸 Spanish' },
    { code: 'fr-FR', label: '🇫🇷 French' },
    { code: 'de-DE', label: '🇩🇪 German' },
    { code: 'ja-JP', label: '🇯🇵 Japanese' },
    { code: 'zh-CN', label: '🇨🇳 Chinese' },
    { code: 'ar-SA', label: '🇸🇦 Arabic' },
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const entry: TranscriptEntry = {
            id: ++idCounter.current,
            text: transcript.trim(),
            timestamp: new Date(),
            isFinal: true,
          };
          setTranscripts(prev => [...prev, entry]);
          setWordCount(prev => prev + transcript.trim().split(/\s+/).length);
          setInterimText('');
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[Speech] Error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow mic permissions.');
        setIsListening(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.warning(`Speech error: ${event.error}. Restarting...`, { duration: 2000 });
      }
    };

    recognition.onend = () => {
      // Auto-restart for continuous listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started, ignore
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success('🎤 Listening started!', { duration: 2000 });
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      ref.stop();
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const copyTranscript = useCallback(() => {
    const fullText = transcripts.map(t => t.text).join(' ');
    if (!fullText) {
      toast.warning('No transcript to copy');
      return;
    }
    navigator.clipboard.writeText(fullText);
    toast.success('📋 Transcript copied!');
  }, [transcripts]);

  const clearTranscript = useCallback(() => {
    setTranscripts([]);
    setWordCount(0);
    setInterimText('');
    toast.info('Transcript cleared');
  }, []);

  const speakText = useCallback(() => {
    const fullText = transcripts.map(t => t.text).join('. ');
    if (!fullText) return;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = language;
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
    toast.success('🔊 Playing back transcript...');
  }, [transcripts, language]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcripts, interimText]);

  if (!isSupported) {
    return (
      <div className="metric-card">
        <div className="flex items-center gap-2 mb-2">
          <MicOff className="w-4 h-4 text-destructive" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Subtitles</h3>
        </div>
        <p className="text-xs text-muted-foreground">Speech recognition is not supported in this browser. Please use Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="scan-line" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className={`w-4 h-4 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
            {isListening && (
              <motion.div
                className="absolute -inset-1 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Live Subtitles
          </h3>
          {isListening && (
            <motion.span
              className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ● LIVE
            </motion.span>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-1.5">
          <Button
            variant={isListening ? 'destructive' : 'default'}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className="gap-1 text-xs"
          >
            {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            <span className="hidden sm:inline">{isListening ? 'Stop' : 'Listen'}</span>
          </Button>
        </div>
      </div>

      {/* Language selector */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {languages.map(l => (
          <button
            key={l.code}
            onClick={() => {
              setLanguage(l.code);
              if (isListening) {
                stopListening();
                setTimeout(() => startListening(), 200);
              }
            }}
            className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap transition-colors border ${
              language === l.code
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Subtitle Display */}
      <div className="relative rounded-lg bg-secondary/30 border border-border overflow-hidden mb-3">
        <div
          ref={scrollRef}
          className="max-h-40 overflow-y-auto p-3 space-y-2 scrollbar-thin"
        >
          {transcripts.length === 0 && !interimText && (
            <div className="text-center py-6">
              <motion.div
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Mic className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              </motion.div>
              <p className="text-xs text-muted-foreground">
                {isListening ? 'Speak now... words will appear here' : 'Click Listen to start'}
              </p>
            </div>
          )}

          <AnimatePresence>
            {transcripts.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 items-start"
              >
                <span className="text-[9px] text-muted-foreground font-mono mt-0.5 shrink-0">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{entry.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Interim (live typing) */}
          {interimText && (
            <motion.div
              className="flex gap-2 items-start"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-[9px] text-primary font-mono mt-0.5 shrink-0">now</span>
              <p className="text-sm text-primary/70 italic leading-relaxed">{interimText}</p>
            </motion.div>
          )}
        </div>

        {/* Subtitle-style overlay bar */}
        {isListening && (interimText || transcripts.length > 0) && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border px-3 py-1.5"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <p className="text-xs text-foreground font-medium truncate">
              🎙️ {interimText || transcripts[transcripts.length - 1]?.text || ''}
            </p>
          </motion.div>
        )}
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-xs font-mono text-foreground">{transcripts.length}</div>
            <div className="text-[9px] text-muted-foreground">sentences</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-mono text-foreground">{wordCount}</div>
            <div className="text-[9px] text-muted-foreground">words</div>
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={speakText} title="Read aloud" className="h-7 w-7 p-0">
            <Volume2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyTranscript} title="Copy" className="h-7 w-7 p-0">
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearTranscript} title="Clear" className="h-7 w-7 p-0">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
