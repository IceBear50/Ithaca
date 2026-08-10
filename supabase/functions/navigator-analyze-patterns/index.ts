import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

interface AnalyzeRequest {
  days_back?: number;
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

    const { days_back = 14 } = (await req.json()) as AnalyzeRequest;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days_back);
    const since = sinceDate.toISOString().split("T")[0];

    // Fetch historical data: reflections, focus sessions, distractions, existing observations
    const [reflectionsResult, focusResult, distResult, existingObsResult, memoryResult] =
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
          .gte("created_at", `${since}T00:00:00`)
          .order("created_at", { ascending: false }),
        supabase
          .from("distractions")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", since)
          .order("date", { ascending: false }),
        supabase
          .from("behavior_observations")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("navigator_memory")
          .select("*")
          .eq("user_id", user.id)
          .eq("memory_type", "pattern")
          .order("significance", { ascending: false }),
      ]);

    const reflections = reflectionsResult.data ?? [];
    const focusSessions = focusResult.data ?? [];
    const distractions = distResult.data ?? [];
    const existingObservations = existingObsResult.data ?? [];
    const existingMemories = memoryResult.data ?? [];

    // If less than 3 days of data, return early
    if (reflections.length < 3) {
      return new Response(JSON.stringify({
        patterns_found: 0,
        message: "Not enough data to detect patterns yet. Continue tracking for at least 3 days.",
        days_of_data: reflections.length,
      }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const systemPrompt = [
      "You are the Navigator's pattern analysis engine in Ithaca — a personal operating system.",
      "You analyse a user's behavioural data over the past days to identify meaningful correlations.",
      "Look for relationships between: energy_level, focus_quality, distraction_time, work_minutes, habit_completion, and task_completion.",
      "For each relationship you detect, specify:",
      "- variable_a and variable_b (the two correlated variables)",
      "- relationship_type ('positive', 'negative', or 'neutral')",
      "- strength (0.0 to 1.0)",
      "- evidence_summary (a human-readable explanation)",
      "- type: one of 'pattern', 'preference', 'insight', 'routine_success', 'routine_failure'",
      "Be conservative — only report patterns with sufficient supporting data.",
      "Respond ONLY with valid JSON. No additional text.",
    ].join("\n");

    const userPrompt = [
      `Analysing past ${days_back} days of data (${since} to today).`,
      "",
      "=== REFLECTIONS (AI summaries & patterns from each day) ===",
      JSON.stringify(reflections.map((r) => ({
        date: r.date,
        completed_tasks: r.completed_tasks,
        missed_tasks: r.missed_tasks,
        actual_work_minutes: r.actual_work_minutes,
        habit_consistency: r.habit_consistency,
        total_distraction_minutes: r.total_distraction_minutes,
        ai_pattern: r.ai_pattern,
        ai_recommendation: r.ai_recommendation,
      })), null, 2),
      "",
      "=== FOCUS SESSIONS ===",
      JSON.stringify(focusSessions.map((s) => ({
        title: s.title,
        planned_minutes: s.planned_minutes,
        actual_minutes: s.actual_minutes,
        energy_level: s.energy_level,
        focus_quality: s.focus_quality,
        status: s.status,
      })), null, 2),
      "",
      "=== DISTRACTIONS ===",
      JSON.stringify(distractions.map((d) => ({
        category: d.category,
        duration_minutes: d.duration_minutes,
        displaced_activity: d.displaced_activity,
      })), null, 2),
      "",
      "=== EXISTING OBSERVATIONS ===",
      JSON.stringify(existingObservations.map((o) => ({
        variable_a: o.variable_a,
        variable_b: o.variable_b,
        relationship_type: o.relationship_type,
        strength: o.strength,
        evidence_summary: o.evidence_summary,
      })), null, 2),
      "",
      "=== EXISTING MEMORIES ===",
      JSON.stringify(existingMemories.map((m) => ({
        content: m.content,
        significance: m.significance,
      })), null, 2),
      "",
      "Return JSON with:",
      "1. `patterns`: array of new patterns/observations found (each with variable_a, variable_b, relationship_type, strength, evidence_summary)",
      "2. `insights`: array of memory items to persist (each with type, content object, significance 0-1)",
      "3. `analysis_summary`: a 2-3 sentence overview of what you found",
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
      temperature: 0.3,
      max_tokens: 2000,
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const patterns = aiResponse.patterns ?? [];
    const insights = aiResponse.insights ?? [];

    // Write new behavior_observations
    const observationResults = [];
    for (const p of patterns) {
      // Avoid duplicates — check if similar observation exists
      const exists = existingObservations.some(
        (o) =>
          o.variable_a === p.variable_a &&
          o.variable_b === p.variable_b,
      );

      if (!exists && p.variable_a && p.variable_b && p.relationship_type) {
        const { data } = await supabase
          .from("behavior_observations")
          .insert({
            user_id: user.id,
            variable_a: p.variable_a,
            variable_b: p.variable_b,
            relationship_type: p.relationship_type,
            strength: Math.min(1, Math.max(0, p.strength ?? 0.5)),
            evidence_summary: p.evidence_summary ?? null,
            data_points: reflections.length,
          })
          .select("id")
          .single();
        if (data) observationResults.push(data.id);
      }
    }

    // Write new navigator_memory items
    const memoryResults = [];
    for (const ins of insights) {
      if (ins.type && ins.content) {
        const { data } = await supabase
          .from("navigator_memory")
          .insert({
            user_id: user.id,
            memory_type: ins.type,
            content: ins.content,
            significance: Math.min(1, Math.max(0, ins.significance ?? 0.5)),
          })
          .select("id")
          .single();
        if (data) memoryResults.push(data.id);
      }
    }

    return new Response(JSON.stringify({
      patterns_found: observationResults.length,
      memories_created: memoryResults.length,
      analysis_summary: aiResponse.analysis_summary ?? null,
      observations: observationResults,
      memories: memoryResults,
      days_analysed: reflections.length,
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("navigator-analyze-patterns error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});