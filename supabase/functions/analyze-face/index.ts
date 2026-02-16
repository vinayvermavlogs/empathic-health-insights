import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert facial, skin, and eye analyzer with medical-grade observation skills. Analyze the person's face in the image and return structured data via the report_face_analysis tool.

Rules:
- Return 3-6 emotions sorted by confidence descending
- Confidences must sum to approximately 100
- Only use these emotion types: happiness, stress, anxiety, sadness, calmness, focus, fatigue, neutral
- For skinAnalysis: examine skin tone, texture, hydration, acne, dark spots, wrinkles, pores, redness
- For eyeAnalysis: examine eye redness, pupil dilation, dark circles, eye strain signs, moisture level, retina visibility
- For blinkDetection: estimate if eyes appear closed/half-closed (blinking) or open. Set isBlinking=true if eyes appear closed or nearly closed
- For gestureSignals: detect any hand gestures near face, head tilts, nods, or facial gestures that could represent sign language or communication signals
- Be accurate and honest about what you see`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this face comprehensively: emotions, skin health, eye/retina condition, blink state, and any gesture signals. Return via the tool.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_face_analysis",
                description: "Report comprehensive face analysis results",
                parameters: {
                  type: "object",
                  properties: {
                    emotions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          emotion: {
                            type: "string",
                            enum: ["happiness", "stress", "anxiety", "sadness", "calmness", "focus", "fatigue", "neutral"],
                          },
                          confidence: { type: "number" },
                        },
                        required: ["emotion", "confidence"],
                        additionalProperties: false,
                      },
                    },
                    facialDetails: { type: "string" },
                    overallMood: { type: "string" },
                    skinAnalysis: {
                      type: "object",
                      properties: {
                        condition: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
                        hydration: { type: "string", enum: ["well-hydrated", "normal", "dry", "very-dry"] },
                        concerns: {
                          type: "array",
                          items: { type: "string" },
                        },
                        skinTone: { type: "string" },
                        overallScore: { type: "number" },
                      },
                      required: ["condition", "hydration", "concerns", "skinTone", "overallScore"],
                      additionalProperties: false,
                    },
                    eyeAnalysis: {
                      type: "object",
                      properties: {
                        strain: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
                        redness: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
                        darkCircles: { type: "string", enum: ["none", "mild", "moderate", "severe"] },
                        moisture: { type: "string", enum: ["normal", "dry", "watery"] },
                        pupilDilation: { type: "string", enum: ["normal", "dilated", "constricted"] },
                        retinaObservation: { type: "string" },
                        overallHealth: { type: "string", enum: ["healthy", "mild-concern", "needs-attention"] },
                      },
                      required: ["strain", "redness", "darkCircles", "moisture", "pupilDilation", "retinaObservation", "overallHealth"],
                      additionalProperties: false,
                    },
                    blinkDetection: {
                      type: "object",
                      properties: {
                        isBlinking: { type: "boolean" },
                        eyeOpenness: { type: "string", enum: ["fully-open", "half-open", "nearly-closed", "closed"] },
                      },
                      required: ["isBlinking", "eyeOpenness"],
                      additionalProperties: false,
                    },
                    gestureSignals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          gesture: { type: "string" },
                          meaning: { type: "string" },
                          confidence: { type: "number" },
                        },
                        required: ["gesture", "meaning", "confidence"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["emotions", "facialDetails", "overallMood", "skinAnalysis", "eyeAnalysis", "blinkDetection", "gestureSignals"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_face_analysis" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    let result;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-face error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
