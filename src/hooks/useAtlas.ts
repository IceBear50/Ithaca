import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { SUPABASE_URL } from "../lib/config";
import type { Tables } from "../lib/database.types";

type BehaviorObservation = Tables<"behavior_observations">;

export interface AtlasNode {
  id: string;
  label: string;
  variable: string;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface AtlasLink {
  source: string;
  target: string;
  relationship_type: "positive" | "negative" | "neutral";
  strength: number;
  evidence_summary: string | null;
  data_points: number;
  id: string;
}

export interface AtlasData {
  observations: BehaviorObservation[];
  loading: boolean;
  error: string | null;
  generating: boolean;
  analysisSummary: string | null;
  daysAnalysed: number;
  runAnalysis: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const VARIABLES: { variable: string; label: string; color: string }[] = [
  { variable: "energy_level", label: "Energy", color: "#d4a853" },
  { variable: "focus_quality", label: "Focus", color: "#2a5c8a" },
  { variable: "mood", label: "Mood", color: "#3a9d8c" },
  { variable: "work_minutes", label: "Study/Work", color: "#7c6ab0" },
  { variable: "exercise", label: "Exercise", color: "#4a9d6a" },
  { variable: "sleep_quality", label: "Sleep", color: "#5b8db8" },
  { variable: "distraction_time", label: "Distractions", color: "#c45a5a" },
  { variable: "habit_completion", label: "Habits", color: "#d4874a" },
  { variable: "goal_progress", label: "Goal Progress", color: "#a07c4a" },
];

export function useAtlas(): AtlasData {
  const { user } = useAuth();
  const [observations, setObservations] = useState<BehaviorObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [daysAnalysed, setDaysAnalysed] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const result = await supabase
      .from("behavior_observations")
      .select("*")
      .eq("user_id", user.id)
      .order("strength", { ascending: false });

    if (result.error) {
      console.error("Error fetching observations:", result.error);
      setError("Could not load pattern data.");
    }

    setObservations(result.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAnalysis = async () => {
    if (!user || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No auth session");

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/navigator-analyze-patterns`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ days_back: 14 }),
        },
      );

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      // Store analysis results
      setAnalysisSummary(body.analysis_summary ?? null);
      setDaysAnalysed(body.days_analysed ?? 0);

      // Refetch observations to get new patterns
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      console.error("runAnalysis error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return {
    observations,
    loading,
    error,
    generating,
    analysisSummary,
    daysAnalysed,
    runAnalysis,
    refresh: fetchData,
  };
}

/** Convert behavior_observations rows into AtlasLink objects */
export function observationsToLinks(observations: BehaviorObservation[]): AtlasLink[] {
  return observations.map((o) => ({
    source: o.variable_a,
    target: o.variable_b,
    relationship_type: o.relationship_type as "positive" | "negative" | "neutral",
    strength: o.strength,
    evidence_summary: o.evidence_summary,
    data_points: o.data_points,
    id: o.id,
  }));
}

/** Get unique variable names referenced across all links */
export function getActiveVariables(links: AtlasLink[]): string[] {
  const vars = new Set<string>();
  for (const l of links) {
    vars.add(l.source);
    vars.add(l.target);
  }
  return Array.from(vars);
}