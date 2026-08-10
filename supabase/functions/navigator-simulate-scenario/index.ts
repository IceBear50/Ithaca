import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

interface SimulateRequest {
  variable: string;
  change_type: "increase" | "decrease";
  change_amount: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { variable, change_type, change_amount } = (await req.json()) as SimulateRequest;

    // Fetch recent data to use as baseline
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split("T")[0];

    const [reflectionsResult, focusResult, distResult, observationsResult, memoriesResult] =
      await Promise.all([
        supabase
          .from("reflections")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", since)
          .order("date", { ascending: false }),
        supabase
          .from("focus_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", `${since}T00:00:00`),
        supabase
          .from("distractions")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", since)
          .order("date", { ascending: false }),
        supabase
          .from("behavior_observations")
          .select("*")
          .eq("user_id", user.id)
          .order("strength", { ascending: false }),
        supabase
          .from("navigator_memory")
          .select("*")
          .eq("user_id", user.id)
          .gte("significance", 0.3)
          .order("significance", { ascending: false }),
      ]);

    const reflections = reflectionsResult.data ?? [];
    const focusSessions = focusResult.data ?? [];
    const distractions = distResult.data ?? [];
    const observations = observationsResult.data ?? [];
    const memories = memoriesResult.data ?? [];

    // Compute baseline stats
    const avgDailyWorkMinutes = reflections.length > 0
      ? Math.round(reflections.reduce((s, r) => s + r.actual_work_minutes, 0) / reflections.length)
      : 0;
    const avgDailyDistractionMinutes = reflections.length > 0
      ? Math.round(reflections.reduce((s, r) => s + r.total_distraction_minutes, 0) / reflections.length)
      : 0;
    const avgFocusQuality = focusSessions.filter((s) => s.focus_quality).length > 0
      ? Math.round(focusSessions.filter((s) => s.focus_quality).reduce((s, f) => s + (f.focus_quality ?? 0), 0) / focusSessions.filter((s) => s.focus_quality).length)
      : 0;
    const avgEnergyLevel = focusSessions.filter((s) => s.energy_level).length > 0
      ? Math.round(focusSessions.filter((s) => s.energy_level).reduce((s, f) => s + (f.energy_level ?? 0), 0) / focusSessions.filter((s) => s.energy_level).length)
      : 0;
    const avgHabitConsistency = reflections.length > 0
      ? Math.round(reflections.reduce((s, r) => s + r.habit_consistency, 0) / reflections.length * 100)
      : 0;
    const taskCompletionRate = reflections.length > 0
      ? Math.round(reflections.reduce((s, r) => s + r.completed_tasks, 0) / Math.max(1, reflections.reduce((s, r) => s + r.completed_tasks + r.missed_tasks, 0)) * 100)
      : 0;

    const systemPrompt = [
      "You are the Navigator's simulation engine in Ithaca — a personal operating system.",
      "You help users understand the potential long-term impact of changing one habit or behaviour.",
      "Given the user's historical data and a proposed change, estimate how things might look at 30, 90, and 180 days.",
      "Be honest and cautious: state clearly that these are estimates based on their personal data, not guarantees.",
      "Use specific numbers when possible. Mention which data informed your estimate.",
      "Respond ONLY with valid JSON. No additional text.",
    ].join("\n");

    const userPrompt = [
      "=== PROPOSED CHANGE ===",
      `Variable: ${variable}`,
      `Change: ${change_type} ${change_amount}`,
      "",
      "=== CURRENT BASELINE (past 30 days) ===",
      JSON.stringify({
        avg_daily_work_minutes: avgDailyWorkMinutes,
        avg_daily_distraction_minutes: avgDailyDistractionMinutes,
        avg_focus_quality: avgFocusQuality,
        avg_energy_level: avgEnergyLevel,
        avg_habit_consistency_percent: avgHabitConsistency,
        task_completion_rate_percent: taskCompletionRate,
        reflection_days: reflections.length,
        total_focus_sessions: focusSessions.length,
        total_distractions: distractions.length,
      }, null, 2),
      "",
      "=== RECENT DISTRACTIONS BY CATEGORY ===",
      JSON.stringify(
        Object.entries(
          distractions.reduce<Record<string, number>>((acc, d) => {
            acc[d.category] = (acc[d.category] ?? 0) + d.duration_minutes;
            return acc;
          }, {}),
        ).map(([category, totalMinutes]) => ({ category, total_minutes: totalMinutes })),
        null, 2,
      ),
      "",
      "=== BEHAVIOR OBSERVATIONS (known correlations) ===",
      JSON.stringify(observations.map((o) => ({
        variable_a: o.variable_a,
        variable_b: o.variable_b,
        relationship_type: o.relationship_type,
        strength: o.strength,
        evidence_summary: o.evidence_summary,
      })), null, 2),
      "",
      "=== NAVIGATOR MEMORIES (patterns & insights) ===",
      JSON.stringify(memories.map((m) => ({
        type: m.memory_type,
        content: m.content,
        significance: m.significance,
      })), null, 2),
      "",
      "Generate estimates across three timeframes:",
      "1. `estimated_30d` — what might change in the first month",
      "2. `estimated_90d` — compounded effects at 3 months",
      "3. `estimated_180d` — sustained change at 6 months",
      "",
      "For each timeframe, include: work_minutes, focus_quality, habit_consistency_percent, task_completion_rate_percent, and a brief description.",
      "Also include `ai_reasoning` explaining how the change cascades based on known patterns.",
    ].join("\n");

    const groq = new OpenAI({
      apiKey: Deno.env.get("GROQ_API_KEY")!,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2500,
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Persist the simulation
    const { data: simulation } = await supabase
      .from("scenario_simulations")
      .insert({
        user_id: user.id,
        variable,
        change_type,
        change_amount,
        estimated_30d: aiResponse.estimated_30d ?? null,
        estimated_90d: aiResponse.estimated_90d ?? null,
        estimated_180d: aiResponse.estimated_180d ?? null,
        ai_reasoning: aiResponse.ai_reasoning ?? null,
      })
      .select("id")
      .single();

    return new Response(JSON.stringify({
      simulation_id: simulation?.id ?? null,
      variable,
      change_type,
      change_amount,
      estimated_30d: aiResponse.estimated_30d ?? null,
      estimated_90d: aiResponse.estimated_90d ?? null,
      estimated_180d: aiResponse.estimated_180d ?? null,
      ai_reasoning: aiResponse.ai_reasoning ?? null,
      baseline: {
        avg_daily_work_minutes: avgDailyWorkMinutes,
        avg_daily_distraction_minutes: avgDailyDistractionMinutes,
        avg_focus_quality: avgFocusQuality,
        avg_energy_level: avgEnergyLevel,
      },
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("navigator-simulate-scenario error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});