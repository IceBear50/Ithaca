import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "../lib/database.types";

type Task = Tables<"tasks">;
type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;
type FocusSession = Tables<"focus_sessions">;
type Distraction = Tables<"distractions">;
type Milestone = Tables<"milestones">;

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export interface VoyageData {
  tasks: Task[];
  habits: (Habit & { todayLog: HabitLog | null })[];
  focusSessions: FocusSession[];
  distractions: Distraction[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
}

export function useVoyage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const today = todayDate();

    const [
      tasksResult,
      habitsResult,
      habitLogsResult,
      focusResult,
      distResult,
      mileResult,
    ] = await Promise.all([
      // Tasks: pending or in_progress (active), or created today
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false }),
      // All user habits
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true }),
      // Today's habit logs
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today),
      // Today's focus sessions
      supabase
        .from("focus_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false }),
      // Today's distractions
      supabase
        .from("distractions")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: false }),
      // All milestones for dropdown
      supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
    ]);

    if (tasksResult.error) setError((prev) => prev ? `${prev}\nTasks: ${tasksResult.error?.message}` : `Tasks: ${tasksResult.error?.message}`);
    if (habitsResult.error) setError((prev) => prev ? `${prev}\nHabits: ${habitsResult.error?.message}` : `Habits: ${habitsResult.error?.message}`);
    if (habitLogsResult.error) setError((prev) => prev ? `${prev}\nHabit logs: ${habitLogsResult.error?.message}` : `Habit logs: ${habitLogsResult.error?.message}`);
    if (focusResult.error) setError((prev) => prev ? `${prev}\nFocus: ${focusResult.error?.message}` : `Focus: ${focusResult.error?.message}`);
    if (distResult.error) setError((prev) => prev ? `${prev}\nDistractions: ${distResult.error?.message}` : `Distractions: ${distResult.error?.message}`);
    if (mileResult.error) setError((prev) => prev ? `${prev}\nMilestones: ${mileResult.error?.message}` : `Milestones: ${mileResult.error?.message}`);

    setTasks(tasksResult.data ?? []);
    setHabits(habitsResult.data ?? []);
    setHabitLogs(habitLogsResult.data ?? []);
    setFocusSessions(focusResult.data ?? []);
    setDistractions(distResult.data ?? []);
    setMilestones(mileResult.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived: habits with today's log attached
  const habitsWithLogs = habits.map((habit) => ({
    ...habit,
    todayLog: habitLogs.find((log) => log.habit_id === habit.id) ?? null,
  }));

  // Stats
  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;
  const completedTaskCount = tasks.filter((t) => t.status === "completed").length;
  const totalFocusMinutes = focusSessions
    .filter((s) => s.status === "completed" && s.actual_minutes)
    .reduce((sum, s) => sum + (s.actual_minutes ?? 0), 0);
  const completedHabitsCount = habitLogs.length;
  const totalDistractionMinutes = distractions.reduce((sum, d) => sum + d.duration_minutes, 0);

  // --- Task CRUD ---
  const createTask = async (input: TablesInsert<"tasks">) => {
    if (!user) return;
    const insert: TablesInsert<"tasks"> = {
      ...input,
      user_id: user.id,
      status: "pending",
    };
    const { data, error: err } = await supabase
      .from("tasks")
      .insert(insert)
      .select()
      .single();
    if (err) throw err;
    setTasks((prev) => [data, ...prev]);
    return data;
  };

  const updateTaskStatus = async (id: string, status: "pending" | "in_progress" | "completed" | "skipped") => {
    const updates: TablesUpdate<"tasks"> = {
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    };
    const { data, error: err } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  };

  const updateTask = async (id: string, updates: TablesUpdate<"tasks">) => {
    const { data, error: err } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  };

  const deleteTask = async (id: string) => {
    const { error: err } = await supabase.from("tasks").delete().eq("id", id);
    if (err) throw err;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Focus Session CRUD ---
  const createFocusSession = async (input: TablesInsert<"focus_sessions">) => {
    if (!user) return;
    const insert: TablesInsert<"focus_sessions"> = {
      ...input,
      user_id: user.id,
      status: "planned",
    };
    const { data, error: err } = await supabase
      .from("focus_sessions")
      .insert(insert)
      .select()
      .single();
    if (err) throw err;
    setFocusSessions((prev) => [data, ...prev]);
    return data;
  };

  const updateFocusSession = async (id: string, updates: TablesUpdate<"focus_sessions">) => {
    const { data, error: err } = await supabase
      .from("focus_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (err) throw err;
    setFocusSessions((prev) => prev.map((s) => (s.id === id ? data : s)));
    return data;
  };

  const deleteFocusSession = async (id: string) => {
    const { error: err } = await supabase.from("focus_sessions").delete().eq("id", id);
    if (err) throw err;
    setFocusSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // --- Habit Log CRUD ---
  const toggleHabitLog = async (habitId: string, existingLog: HabitLog | null) => {
    if (!user) return;
    if (existingLog) {
      // Remove log (uncheck)
      const { error: err } = await supabase
        .from("habit_logs")
        .delete()
        .eq("id", existingLog.id);
      if (err) throw err;
      setHabitLogs((prev) => prev.filter((l) => l.id !== existingLog.id));
    } else {
      // Add log (check)
      const insert: TablesInsert<"habit_logs"> = {
        user_id: user.id,
        habit_id: habitId,
        date: todayDate(),
        count: 1,
      };
      const { data, error: err } = await supabase
        .from("habit_logs")
        .insert(insert)
        .select()
        .single();
      if (err) throw err;
      setHabitLogs((prev) => [...prev, data]);
    }
  };

  // --- Distraction CRUD ---
  const createDistraction = async (input: TablesInsert<"distractions">) => {
    if (!user) return;
    const insert: TablesInsert<"distractions"> = {
      ...input,
      user_id: user.id,
      date: todayDate(),
    };
    const { data, error: err } = await supabase
      .from("distractions")
      .insert(insert)
      .select()
      .single();
    if (err) throw err;
    setDistractions((prev) => [data, ...prev]);
    return data;
  };

  const deleteDistraction = async (id: string) => {
    const { error: err } = await supabase.from("distractions").delete().eq("id", id);
    if (err) throw err;
    setDistractions((prev) => prev.filter((d) => d.id !== id));
  };

  return {
    // Data
    tasks,
    habits: habitsWithLogs,
    focusSessions,
    distractions,
    milestones,
    loading,
    error,
    // Stats
    pendingTaskCount,
    completedTaskCount,
    totalFocusMinutes,
    completedHabitsCount,
    totalDistractionMinutes,
    // Actions
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    createFocusSession,
    updateFocusSession,
    deleteFocusSession,
    toggleHabitLog,
    createDistraction,
    deleteDistraction,
    refresh: fetchData,
  };
}