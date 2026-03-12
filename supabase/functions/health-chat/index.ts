import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";

    if (mode === "session-summary") {
      systemPrompt = `You are NeuroSense AI, a clinical health analytics assistant. You are given session data containing emotions, health metrics, and wellness scores. Generate a comprehensive clinical summary report with:
1. **Session Overview** - Duration, dominant mood, wellness score
2. **Emotional Analysis** - Breakdown of detected emotions with clinical interpretation
3. **Health Metrics Review** - Heart rate, HRV, SpO2, cortisol analysis with medical context
4. **Risk Factors** - Any concerning patterns or anomalies
5. **Personalized Recommendations** - Actionable wellness advice based on findings
6. **Trend Analysis** - Compare with previous sessions if available
Use medical terminology but keep it accessible. Use emojis for visual clarity.`;
    } else if (mode === "emotion-predict") {
      systemPrompt = `You are NeuroSense AI Predictor. Analyze the provided session history data and predict:
1. **Mood Forecast** - Likely emotional state in the next session
2. **Pattern Recognition** - Recurring emotional/physiological cycles
3. **Risk Indicators** - Early warning signs of stress, burnout, or health concerns
4. **Wellness Trajectory** - Is overall health trending up or down?
5. **Lifestyle Correlations** - Time-of-day patterns, session duration impacts
Be data-driven and specific. Use percentages and confidence levels.`;
    } else if (mode === "skin-eye-diagnosis") {
      systemPrompt = `You are NeuroSense Dermatology & Ophthalmology AI. Analyze skin and eye health data to provide:
1. **Skin Health Assessment** - Hydration, tone, texture, UV damage indicators
2. **Eye Health Analysis** - Strain level, redness, moisture, pupil response
3. **Clinical Observations** - Notable findings with medical context
4. **Severity Classification** - Low/Medium/High risk ratings
5. **Treatment Recommendations** - Evidence-based skincare and eye care advice
6. **Follow-up Indicators** - When to seek professional evaluation
Disclaimer: This is AI-assisted analysis, not a medical diagnosis.`;
    } else {
      systemPrompt = `You are NeuroSense AI, an advanced health and wellness assistant integrated into a real-time biometric monitoring system. You have access to facial emotion detection, heart rate monitoring, HRV analysis, cortisol tracking, SpO2 measurement, and skin/eye health analysis.

Your capabilities:
- Analyze emotional patterns and their physiological correlations
- Provide evidence-based wellness recommendations
- Explain health metrics in accessible language
- Offer stress management and mental health guidance
- Discuss nutrition, sleep, and lifestyle optimizations
- Interpret biometric data trends

Be empathetic, scientifically accurate, and proactive. Use emojis for visual clarity. Keep responses concise but thorough. Always note that you provide wellness guidance, not medical diagnoses.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("health-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
