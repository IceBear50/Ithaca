import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { SUPABASE_URL } from "../lib/config";
import type { Tables } from "../lib/database.types";

type Reflection = Tables<"reflections">;
type NavigatorMemory = Tables<"navigator_memory">;

export interface MirrorStats {
  planned_work_minutes: number;
  actual_work_minutes: number;
  planned_sessions: number;
  actual_sessions: number;
  completed_tasks: number;
  missed_tasks: number;
  habit_consistency: number;
  total_distraction_minutes: number;
}

export interface MirrorData {
  reflection: Reflection | null;
  memories: NavigatorMemory[];
  loading: boolean;
  error: string | null;
  generating: boolean;
  date: string;
  hasTodayData: boolean;
  runReflection: () => Promise<void>;
  setDate: (date: string) => void;
  goPrevDay: () => void;
  goNextDay: () => void;
  isToday: boolean;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function useMirror(): MirrorData {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [memories, setMemories] = useState<NavigatorMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [date, setDateState] = useState(formatDate(new Date()));

  const today = formatDate(new Date());
  const isToday = date === today;
  const [hasTodayData, setHasTodayData] = useState(false);

  // Check if today has any voyage data
  useEffect(() => {
    if (!user || !isToday) {
      setHasTodayData(false);
      return;
    }
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;
    supabase
      .from("focus_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .then(({ count }: { count: number | null }) => {
        setHasTodayData((count ?? 0) > 0);
      });
  }, [user, isToday, today]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [reflectionResult, memoriesResult] = await Promise.all([
      supabase
        .from("reflections")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle(),
      supabase
        .from("navigator_memory")
        .select("*")
        .eq("user_id", user.id)
        .order("significance", { ascending: false })
        .limit(5),
    ]);

    if (reflectionResult.error) {
      console.error("Error fetching reflection:", reflectionResult.error);
      setError("Could not load reflection data.");
    }
    if (memoriesResult.error) {
      console.error("Error fetching memories:", memoriesResult.error);
    }

    setReflection(reflectionResult.data ?? null);
    setMemories(memoriesResult.data ?? []);
    setLoading(false);
  }, [user, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runReflection = async () => {
    if (!user || generating) return;
    setGenerating(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No auth session");

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/navigator-reflect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }

      // Refetch the reflection after generation
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      console.error("runReflection error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const setDate = (d: string) => {
    setDateState(d);
  };

  const goPrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDateState(formatDate(d));
  };

  const goNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDateState(formatDate(d));
  };

  return {
    reflection,
    memories,
    loading,
    error,
    generating,
    date,
    hasTodayData,
    runReflection,
    setDate,
    goPrevDay,
    goNextDay,
    isToday,
  };
}