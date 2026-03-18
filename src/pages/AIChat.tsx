import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Bot, User, Sparkles, Brain, Heart, Eye,
  Loader2, Trash2, Stethoscope
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

const QUICK_PROMPTS = [
  { icon: '🧠', label: 'Analyze my stress levels', prompt: 'Analyze common stress patterns and how they affect biometric readings like heart rate, HRV, and cortisol. What are early warning signs?' },
  { icon: '😴', label: 'Sleep optimization', prompt: 'Based on typical biometric data, what are the best strategies to improve sleep quality? Include HRV and heart rate considerations.' },
  { icon: '💪', label: 'Wellness routine', prompt: 'Design a comprehensive daily wellness routine that optimizes emotional health, cardiovascular fitness, and mental clarity.' },
  { icon: '🍎', label: 'Nutrition for mood', prompt: 'What nutrition strategies can improve emotional regulation and reduce cortisol levels? Include specific food recommendations.' },
  { icon: '🧘', label: 'Breathing exercises', prompt: 'Recommend breathing exercises that improve HRV and reduce stress. Include step-by-step techniques.' },
  { icon: '👁️', label: 'Eye strain relief', prompt: 'What are the best practices for reducing digital eye strain? Include exercises and workspace ergonomics.' },
];

const AIChat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (allMessages: Msg[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages, mode: 'chat' }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    if (!resp.body) throw new Error('No stream body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') break;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantText += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
              }
              return [...prev, { role: 'assistant', content: assistantText }];
            });
          }
        } catch {}
      }
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (e: any) {
      toast({ title: 'AI Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">🤖 Emotion Detector AI</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="gap-1.5 text-xs">
            <Trash2 className="w-4 h-4" /> Clear
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-4 overflow-y-auto">
        {messages.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Emotion Detector AI</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your personal AI health consultant. Ask about emotions, biometrics, wellness strategies, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
              {QUICK_PROMPTS.map((qp, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => send(qp.prompt)}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left text-sm"
                >
                  <span className="text-lg">{qp.icon}</span>
                  <span className="text-foreground">{qp.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-4">
              {[
                { icon: <Stethoscope className="w-5 h-5" />, title: 'Health Analysis', desc: 'Deep-dive into your biometric data' },
                { icon: <Heart className="w-5 h-5" />, title: 'Emotional Guidance', desc: 'Evidence-based wellness strategies' },
                { icon: <Eye className="w-5 h-5" />, title: 'Visual Health', desc: 'Skin & eye health consultations' },
              ].map((card, i) => (
                <Card key={i} className="bg-secondary/30 border-border/50">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-primary mx-auto w-fit">{card.icon}</div>
                    <p className="text-xs font-semibold text-foreground">{card.title}</p>
                    <p className="text-[10px] text-muted-foreground">{card.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 pb-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="bg-secondary/50 rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your health, emotions, wellness..."
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" disabled={isLoading || !input.trim()} className="gap-1.5">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            NeuroSense AI provides wellness guidance, not medical diagnoses. Consult a healthcare professional for medical concerns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
