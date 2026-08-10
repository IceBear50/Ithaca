import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

interface ReflectRequest {
  date: string;
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

    const { date } = (await req.json()) as ReflectRequest;
    const today = date || new Date().toISOString().split("T")[0];

    // Fetch today's data: plan, tasks, focus sessions, habits, distractions
    const [planResult, tasksResult, focusResult, habitsResult, habitLogsResult, distResult] =
      await Promise.all([
        supabase
          .from("daily_plans")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today),
        supabase
          .from("focus_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`),
        supabase
          .from("habits")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("habit_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today),
        supabase
          .from("distractions")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", today),
      ]);

    const plan = planResult.data;
    const tasks = tasksResult.data ?? [];
    const focusSessions = focusResult.data ?? [];
    const allHabits = habitsResult.data ?? [];
    const habitLogs = habitLogsResult.data ?? [];
    const distractions = distResult.data ?? [];

    // Compute stats
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const missedTasks = tasks.filter((t) => t.status === "skipped" || t.status === "pending").length;
    const plannedWorkMinutes = focusSessions.reduce((sum, s) => sum + s.planned_minutes, 0);
    const actualWorkMinutes = focusSessions
      .filter((s) => s.status === "completed" && s.actual_minutes)
      .reduce((sum, s) => sum + (s.actual_minutes ?? 0), 0);
    const plannedSessions = focusSessions.length;
    const actualSessions = focusSessions.filter((s) => s.status === "completed").length;
    const totalDistractionMinutes = distractions.reduce((sum, d) => sum + d.duration_minutes, 0);
    const habitConsistency =
      allHabits.length > 0
        ? habitLogs.length / allHabits.length
        : 0;

    // Build prompt for AI
    const systemPrompt = [
      "You are the Navigator's reflection engine in Ithaca — a personal operating system.",
      "You analyse a user's day and produce a structured reflection.",
      "Be insightful but cautious — use language like 'The data suggests...' rather than making absolute claims.",
      "Always find one actionable pattern and one specific recommendation.",
      "Respond ONLY with valid JSON matching the output schema. No additional text.",
    ].join("\n");

    const userPrompt = [
      `Reflection for ${today}`,
      "",
      "=== STATS ===",
      JSON.stringify({
        completed_tasks: completedTasks,
        missed_tasks: missedTasks,
        planned_work_minutes: plannedWorkMinutes,
        actual_work_minutes: actualWorkMinutes,
        planned_sessions: plannedSessions,
        actual_sessions: actualSessions,
        total_distraction_minutes: totalDistractionMinutes,
        habit_consistency: Math.round(habitConsistency * 100),
      }, null, 2),
      "",
      "=== TASKS ===",
      JSON.stringify(tasks.map((t) => ({ title: t.title, priority: t.priority, status: t.status, estimated_minutes: t.estimated_minutes })), null, 2),
      "",
      "=== FOCUS SESSIONS ===",
      JSON.stringify(focusSessions.map((s) => ({ title: s.title, planned_minutes: s.planned_minutes, actual_minutes: s.actual_minutes, energy_level: s.energy_level, focus_quality: s.focus_quality, status: s.status })), null, 2),
      "",
      "=== HABITS ===",
      JSON.stringify({
        total: allHabits.length,
        completed: habitLogs.length,
        list: allHabits.map((h) => ({ name: h.name, done: habitLogs.some((l) => l.habit_id === h.id) })),
      }, null, 2),
      "",
      "=== DISTRACTIONS ===",
      JSON.stringify(distractions.map((d) => ({ category: d.category, duration_minutes: d.duration_minutes, displaced_activity: d.displaced_activity })), null, 2),
      "",
      plan?.ai_insight ? `=== MORNING PLAN INSIGHT ===\n${JSON.stringify(plan.ai_insight)}` : "",
      "",
      "Generate a reflection with:",
      "1. `summary`: A 1-2 sentence overview of the day (what happened)",
      "2. `reasoning`: Why things went well or poorly (2-3 sentences, referencing the data)",
      "3. `pattern`: One behavioural pattern visible in the data (keep it specific)",
      "4. `recommendation`: One actionable recommendation for tomorrow",
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
      max_tokens: 1500,
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Write or update reflection
    const reflectionPayload = {
      user_id: user.id,
      date: today,
      planned_work_minutes: plannedWorkMinutes,
      actual_work_minutes: actualWorkMinutes,
      planned_sessions: plannedSessions,
      actual_sessions: actualSessions,
      completed_tasks: completedTasks,
      missed_tasks: missedTasks,
      habit_consistency: habitConsistency,
      total_distraction_minutes: totalDistractionMinutes,
      ai_summary: aiResponse.summary ?? null,
      ai_reasoning: aiResponse.reasoning ?? null,
      ai_pattern: aiResponse.pattern ?? null,
      ai_recommendation: aiResponse.recommendation ?? null,
      raw_ai_response: aiResponse,
    };

    const existingReflection = await supabase
      .from("reflections")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    let reflectionId: string;
    if (existingReflection.data) {
      const { data } = await supabase
        .from("reflections")
        .update(reflectionPayload)
        .eq("id", existingReflection.data.id)
        .select("id")
        .single();
      reflectionId = data?.id ?? existingReflection.data.id;
    } else {
      const { data } = await supabase
        .from("reflections")
        .insert(reflectionPayload)
        .select("id")
        .single();
      reflectionId = data!.id;
    }

    return new Response(JSON.stringify({
      reflection_id: reflectionId,
      summary: aiResponse.summary ?? null,
      reasoning: aiResponse.reasoning ?? null,
      pattern: aiResponse.pattern ?? null,
      recommendation: aiResponse.recommendation ?? null,
      stats: {
        completed_tasks: completedTasks,
        missed_tasks: missedTasks,
        planned_work_minutes: plannedWorkMinutes,
        actual_work_minutes: actualWorkMinutes,
        planned_sessions: plannedSessions,
        actual_sessions: actualSessions,
        total_distraction_minutes: totalDistractionMinutes,
        habit_consistency: Math.round(habitConsistency * 100),
      },
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("navigator-reflect error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});