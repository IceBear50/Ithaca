import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { SUPABASE_URL } from "../lib/config";
import type { Tables } from "../lib/database.types";

type ScenarioSimulation = Tables<"scenario_simulations">;

// ── Types ─────────────────────────────────────────────────────
export interface ScenarioOutcome {
  work_minutes: number;
  focus_quality: number;
  habit_consistency_percent: number;
  task_completion_rate_percent: number;
  description: string;
}

export interface SimulationResult {
  simulation_id: string | null;
  variable: string;
  change_type: "increase" | "decrease";
  change_amount: string;
  estimated_30d: ScenarioOutcome | null;
  estimated_90d: ScenarioOutcome | null;
  estimated_180d: ScenarioOutcome | null;
  ai_reasoning: string | null;
  baseline: {
    avg_daily_work_minutes: number;
    avg_daily_distraction_minutes: number;
    avg_focus_quality: number;
    avg_energy_level: number;
  } | null;
}

export interface ForksData {
  history: ScenarioSimulation[];
  currentResult: SimulationResult | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  runSimulation: (
    variable: string,
    change_type: "increase" | "decrease",
    change_amount: string,
  ) => Promise<void>;
  selectHistoryItem: (item: ScenarioSimulation) => void;
  clearCurrent: () => void;
  refresh: () => Promise<void>;
}

// ── Simulatable variables ─────────────────────────────────────
export const SIM_VARIABLES: { variable: string; label: string; unit: string }[] = [
  { variable: "work_minutes", label: "Study / Work Time", unit: "min/day" },
  { variable: "distraction_time", label: "Distractions", unit: "min/day" },
  { variable: "sleep_quality", label: "Sleep Quality", unit: "hours" },
  { variable: "exercise", label: "Exercise", unit: "min/day" },
  { variable: "energy_level", label: "Energy Level", unit: "/10" },
  { variable: "focus_quality", label: "Focus Quality", unit: "/10" },
  { variable: "habit_completion", label: "Habit Completion", unit: "%" },
];

// ── Format helpers ────────────────────────────────────────────
export function formatChangeAmount(
  variable: string,
  change_type: "increase" | "decrease",
  amount: string,
): string {
  const sym = change_type === "increase" ? "+" : "−";
  const simVar = SIM_VARIABLES.find((v) => v.variable === variable);
  const unit = simVar?.unit ?? "";
  return `${sym}${amount} ${unit}`;
}

export function simVarLabel(variable: string): string {
  return SIM_VARIABLES.find((v) => v.variable === variable)?.label ?? variable;
}

// ── Hook ──────────────────────────────────────────────────────
export function useForks(): ForksData {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScenarioSimulation[]>([]);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const result = await supabase
      .from("scenario_simulations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (result.error) {
      console.error("Error fetching simulation history:", result.error);
      setError("Could not load simulation history.");
    }

    setHistory(result.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runSimulation = async (
    variable: string,
    change_type: "increase" | "decrease",
    change_amount: string,
  ) => {
    if (!user || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No auth session");

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/navigator-simulate-scenario`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ variable, change_type, change_amount }),
        },
      );

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      // Validate and coerce the AI response
      const result: SimulationResult = {
        simulation_id: body.simulation_id ?? null,
        variable: body.variable,
        change_type: body.change_type,
        change_amount: body.change_amount,
        estimated_30d: body.estimated_30d
          ? coerceOutcome(body.estimated_30d)
          : null,
        estimated_90d: body.estimated_90d
          ? coerceOutcome(body.estimated_90d)
          : null,
        estimated_180d: body.estimated_180d
          ? coerceOutcome(body.estimated_180d)
          : null,
        ai_reasoning: body.ai_reasoning ?? null,
        baseline: body.baseline ?? null,
      };

      setCurrentResult(result);

      // Refresh history to include the new simulation
      await fetchHistory();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      console.error("runSimulation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const selectHistoryItem = (item: ScenarioSimulation) => {
    setCurrentResult({
      simulation_id: item.id,
      variable: item.variable,
      change_type: item.change_type as "increase" | "decrease",
      change_amount: item.change_amount,
      estimated_30d: item.estimated_30d
        ? coerceOutcome(item.estimated_30d)
        : null,
      estimated_90d: item.estimated_90d
        ? coerceOutcome(item.estimated_90d)
        : null,
      estimated_180d: item.estimated_180d
        ? coerceOutcome(item.estimated_180d)
        : null,
      ai_reasoning: item.ai_reasoning,
      baseline: null, // Not stored in DB, will not show baseline for history items
    });
  };

  const clearCurrent = () => setCurrentResult(null);

  return {
    history,
    currentResult,
    loading,
    error,
    generating,
    runSimulation,
    selectHistoryItem,
    clearCurrent,
    refresh: fetchHistory,
  };
}

/** Safely coerce a JSON blob (unknown shape from AI) into a ScenarioOutcome */
function coerceOutcome(val: unknown): ScenarioOutcome | null {
  if (!val || typeof val !== "object") return null;
  const obj = val as Record<string, unknown>;
  return {
    work_minutes: safeNum(obj.work_minutes, 0),
    focus_quality: safeNum(obj.focus_quality, 0),
    habit_consistency_percent: safeNum(obj.habit_consistency_percent, 0),
    task_completion_rate_percent: safeNum(
      obj.task_completion_rate_percent,
      0,
    ),
    description: typeof obj.description === "string" ? obj.description : "",
  };
}

function safeNum(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : fallback;
}