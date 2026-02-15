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
              content: `You are an expert facial emotion analyzer. Analyze the person's face in the image and return a JSON object with the following structure. Do NOT include any text outside the JSON.

{
  "emotions": [
    { "emotion": "<one of: happiness, stress, anxiety, sadness, calmness, focus, fatigue, neutral>", "confidence": <0-100> }
  ],
  "facialDetails": "<brief description of facial features observed: eye openness, brow position, mouth shape, skin tone, etc.>",
  "overallMood": "<one word summary>"
}

Rules:
- Return 3-6 emotions sorted by confidence descending
- Confidences must sum to approximately 100
- Only use these emotion types: happiness, stress, anxiety, sadness, calmness, focus, fatigue, neutral
- Be accurate and honest about what you see`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze the emotions visible on this person's face. Return only valid JSON.",
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
                name: "report_emotions",
                description: "Report the detected emotions from the face analysis",
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
                  },
                  required: ["emotions", "facialDetails", "overallMood"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_emotions" } },
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

    // Extract from tool call
    let result;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
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
