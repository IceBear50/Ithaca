import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

interface PlanRequest {
  date: string;
  user_context?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    // Verify JWT and get user_id
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

    const { date, user_context } = (await req.json()) as PlanRequest;

    // Fetch data the Navigator needs: pending tasks, habits, life areas, milestones, memory
    const today = date || new Date().toISOString().split("T")[0];

    const [pendingTasks, habits, lifeAreas, milestones, memories, existingPlan] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("priority")
        .order("created_at", { ascending: false }),
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("life_areas")
        .select("*")
        .eq("user_id", user.id)
        .order("importance", { ascending: false }),
      supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("order_index"),
      supabase
        .from("navigator_memory")
        .select("*")
        .eq("user_id", user.id)
        .gte("significance", 0.4)
        .order("significance", { ascending: false }),
      supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),
    ]);

    // Build context for the AI
    const systemPrompt = [
      "You are the Navigator, the AI core of Ithaca — a personal operating system that helps users align their daily actions with their long-term destination.",
      "Your role is to generate a structured daily plan that prioritises tasks meaningfully, suggests focus blocks, and provides a brief insight about the day.",
      "Respond ONLY with valid JSON matching the output schema. No additional text.",
    ].join("\n");

    const userPrompt = [
      `Today's date: ${today}`,
      user_context ? `User's note: ${user_context}` : "",
      "",
      "=== LIFE AREAS (in order of importance) ===",
      JSON.stringify(lifeAreas.data ?? [], null, 2),
      "",
      "=== ACTIVE MILESTONES ===",
      JSON.stringify(milestones.data ?? [], null, 2),
      "",
      "=== PENDING TASKS ===",
      JSON.stringify(pendingTasks.data ?? [], null, 2),
      "",
      "=== HABITS ===",
      JSON.stringify(habits.data ?? [], null, 2),
      "",
      "=== NAVIGATOR MEMORY (patterns & preferences) ===",
      JSON.stringify(memories.data ?? [], null, 2),
      "",
      "Generate a daily plan with:",
      "1. A short `ai_insight` (what the user should keep in mind today)",
      "2. A re-prioritised list of `tasks` — keep existing task IDs, reorder them, assign priority, and suggest a scheduled_time (HH:MM format in 24h) if it makes sense",
      "3. An array of `focus_blocks` — suggested deep-work sessions with title, planned_minutes, and scheduled time",
      "4. A `morning_routine_info` — which habits to complete first thing",
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

    // Upsert daily plan
    const planPayload = {
      user_id: user.id,
      date: today,
      navigator_generated: true,
      ai_insight: aiResponse.ai_insight ? { insight: aiResponse.ai_insight, focus_blocks: aiResponse.focus_blocks ?? [], morning_routine: aiResponse.morning_routine_info ?? [] } : null,
    };

    let planId: string;
    if (existingPlan.data) {
      const { data } = await supabase
        .from("daily_plans")
        .update(planPayload)
        .eq("id", existingPlan.data.id)
        .select("id")
        .single();
      planId = data?.id ?? existingPlan.data.id;
    } else {
      const { data } = await supabase
        .from("daily_plans")
        .insert(planPayload)
        .select("id")
        .single();
      planId = data!.id;
    }

    // Update task priorities and scheduled times from AI response
    const aiTasks = aiResponse.tasks ?? [];
    if (aiTasks.length > 0) {
      const updates = aiTasks.map((t: { id: string; priority?: string; scheduled_time?: string | null }) => {
        if (!t.id) return null;
        const update: Record<string, unknown> = { daily_plan_id: planId };
        if (t.priority && ["high", "medium", "low"].includes(t.priority)) update.priority = t.priority;
        update.scheduled_time = t.scheduled_time || null;
        return supabase.from("tasks").update(update).eq("id", t.id).eq("user_id", user.id);
      }).filter(Boolean);
      await Promise.all(updates);
    }

    return new Response(JSON.stringify({
      plan_id: planId,
      ai_insight: aiResponse.ai_insight ?? null,
      focus_blocks: aiResponse.focus_blocks ?? [],
      morning_routine: aiResponse.morning_routine_info ?? [],
      tasks: aiTasks,
    }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("navigator-generate-plan error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", detail: err instanceof Error ? err.message : String(err) }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});