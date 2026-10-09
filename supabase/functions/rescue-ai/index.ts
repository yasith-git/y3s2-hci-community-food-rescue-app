import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  imageUri?: string;
  imageBase64?: string;
  context?: {
    title?: string;
    description?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AnalyzeRequest = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    let suggestions = {
      name: body.context?.title || "Surplus Food Rescue",
      category: "Prepared Meals",
      unit: "portions",
      description: body.context?.description || "Fresh food surplus prepared for immediate community collection.",
    };

    if (geminiApiKey) {
      try {
        const prompt = `You are RescueAI, an AI assistant assisting food donors in categorizing surplus food for community rescue.
Analyze this food listing:
Title hint: ${body.context?.title || "N/A"}
Description hint: ${body.context?.description || "N/A"}

Provide a JSON response with:
- name: A clean, descriptive food title (e.g. "Vegetable Fried Rice", "Fresh Baguettes")
- category: Exactly one of ['Bakery', 'Prepared Meals', 'Rice & Curry', 'Vegetables', 'Fruit', 'Dairy', 'Packaged Food', 'Beverages', 'Other']
- unit: Exactly one of ['portions', 'packs', 'boxes', 'loaves', 'kg', 'items', 'containers']
- description: A brief, factual summary of the food items (max 2 sentences).

IMPORTANT SAFETY RULE: NEVER assert that food is safe to eat, allergen-free, or certified safe.

Respond ONLY with valid JSON in this format:
{"name": "...", "category": "...", "unit": "...", "description": "..."}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            suggestions = {
              name: parsed.name || suggestions.name,
              category: parsed.category || suggestions.category,
              unit: parsed.unit || suggestions.unit,
              description: parsed.description || suggestions.description,
            };
          }
        }
      } catch (geminiErr) {
        console.error("Gemini API call failed, falling back to deterministic response:", geminiErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        engineVersion: "rescue-ai-v1",
        notice: "AI-assisted suggestion. Food donor verifies all safety details prior to publishing.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
