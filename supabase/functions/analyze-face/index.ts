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

    const requestBody = JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert facial, skin, eye, gesture, and sign language analyzer with medical-grade observation skills. Analyze the person in the image and return structured data via the report_face_analysis tool.

For boundingBoxes: Return approximate bounding box regions for detected face and hands as normalized coordinates (0.0 to 1.0 relative to image dimensions). Each box needs: label (e.g. "Face", "Left Hand", "Right Hand"), x, y (top-left corner), width, height (all 0-1 normalized), color (hex like "#00ff00" for face, "#ff00ff" for hands, "#00ffff" for gestures), and confidence (0-100). ALWAYS return at least a face bounding box if a face is visible.

Rules:
- Return 3-6 emotions sorted by confidence descending
- Confidences must sum to approximately 100
- Only use these emotion types: happiness, stress, anxiety, sadness, calmness, focus, fatigue, neutral
- For skinAnalysis: examine skin tone, texture, hydration, acne, dark spots, wrinkles, pores, redness
- For eyeAnalysis: examine eye redness, pupil dilation, dark circles, eye strain signs, moisture level, retina visibility
- For blinkDetection: CRITICAL — carefully check if eyes are closed, nearly-closed, or half-open. If the eyes appear closed or mostly closed, set isBlinking=true. If eyes are fully open, set isBlinking=false.
- For signLanguageLetter: VERY IMPORTANT — Look at the person's hands carefully. If they are forming an ASL (American Sign Language) hand sign, identify which letter (a-z) it represents. Use lowercase single letter. Common signs:
  * A = closed fist with thumb on side
  * B = flat open hand, fingers together pointing up, thumb tucked
  * C = curved hand forming C shape
  * D = index finger up, other fingers curled touching thumb
  * E = fingers curled down, thumb tucked under
  * F = OK sign with index and thumb touching, other 3 fingers up
  * I = pinky finger up, rest closed
  * K = index and middle finger up in V, thumb between them
  * L = L shape with index finger and thumb
  * O = fingers and thumb form circle
  * R = crossed index and middle finger
  * S = closed fist with thumb over fingers
  * U = index and middle finger up together
  * V = peace/victory sign
  * W = three fingers up (index, middle, ring)
  * X = index finger hooked/bent
  * Y = thumb and pinky out (shaka/hang loose)
  If NO hand sign is visible or hands are not forming a recognizable letter, set to null.
  Set confidence 0-100 for how sure you are.
- For gestureSignals: detect ALL visible hand gestures, body language, head movements. Key gestures to detect:
  * Shaking hand left-to-right / waving = "Hello / Greeting"
  * Thumbs up = "Approval / Yes"
  * Thumbs down = "Disapproval / No"
  * Peace / Victory sign (two fingers) = "Peace / Victory"
  * OK sign (thumb + index circle) = "OK / Agreement"
  * Open palm facing forward = "Stop / Wait"
  * Closed fist = "Strength / Solidarity"
  * Pointing index finger = "Directing attention"
  * Heart shape with both hands = "Love / Affection"
  * Hand on chin = "Thinking / Contemplating"
  * Crossed arms = "Defensive / Closed off"
  * Head nodding = "Agreement"
  * Head shaking = "Disagreement"
  If none visible, return empty array.
- Be accurate and honest — do NOT fabricate signs or gestures that aren't visible`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image: emotions, skin, eye/retina, blink state, sign language hand letter (ASL a-z), and gestures. Return via the tool.",
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
                    concerns: { type: "array", items: { type: "string" } },
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
                signLanguageLetter: {
                  type: "object",
                  properties: {
                    letter: { type: "string", description: "Single lowercase letter a-z or null if not detected" },
                    confidence: { type: "number", description: "0-100 confidence" },
                  },
                  required: ["letter", "confidence"],
                  additionalProperties: false,
                },
                boundingBoxes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "e.g. Face, Left Hand, Right Hand" },
                      x: { type: "number", description: "normalized 0-1 top-left x" },
                      y: { type: "number", description: "normalized 0-1 top-left y" },
                      width: { type: "number", description: "normalized 0-1 width" },
                      height: { type: "number", description: "normalized 0-1 height" },
                      color: { type: "string", description: "hex color e.g. #00ff00" },
                      confidence: { type: "number" },
                    },
                    required: ["label", "x", "y", "width", "height", "color", "confidence"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["emotions", "facialDetails", "overallMood", "skinAnalysis", "eyeAnalysis", "blinkDetection", "gestureSignals", "signLanguageLetter", "boundingBoxes"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_face_analysis" } },
    });

    // Retry logic with exponential backoff for rate limits
    let response: Response | null = null;
    const maxRetries = 4;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: requestBody,
        }
      );

      if (response.status === 429 && attempt < maxRetries) {
        // Wait with exponential backoff: 2s, 4s, 8s, 16s
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), retrying in ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      if (response?.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = response ? await response.text() : "No response";
      console.error("AI gateway error:", response?.status, text);
      throw new Error(`AI gateway error: ${response?.status}`);
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
