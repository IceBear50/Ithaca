import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Tables, TablesInsert, TablesUpdate } from "../lib/database.types";

type Destination = Tables<"destinations">;
type Milestone = Tables<"milestones">;

export interface IthacaData {
  destination: Destination | null;
  milestones: Milestone[];
  loading: boolean;
}

export function useIthaca() {
  const { user } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [destResult, mileResult] = await Promise.all([
      supabase
        .from("destinations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true }),
    ]);

    if (destResult.error) console.error("Error fetching destination:", destResult.error);
    if (mileResult.error) console.error("Error fetching milestones:", mileResult.error);

    setDestination(destResult.data ?? null);
    setMilestones(mileResult.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateDestination = async (updates: TablesUpdate<"destinations">) => {
    if (!destination || !user) return;
    const { error } = await supabase
      .from("destinations")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", destination.id);
    if (error) throw error;
    setDestination((prev) => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
  };

  const createMilestone = async (input: {
    title: string;
    description?: string;
    target_date?: string;
    order_index?: number;
  }) => {
    if (!user) return;
    const insert: TablesInsert<"milestones"> = {
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      target_date: input.target_date ?? null,
      status: "not_started",
      order_index: input.order_index ?? milestones.length,
      destination_id: destination?.id ?? null,
    };
    const { data, error } = await supabase
      .from("milestones")
      .insert(insert)
      .select()
      .single();
    if (error) throw error;
    setMilestones((prev) => [...prev, data]);
  };

  const updateMilestone = async (id: string, updates: TablesUpdate<"milestones">) => {
    const { error, data } = await supabase
      .from("milestones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setMilestones((prev) => prev.map((m) => (m.id === id ? data : m)));
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) throw error;
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMilestoneStatus = async (id: string, status: "not_started" | "in_progress" | "completed") => {
    await updateMilestone(id, { status });
  };

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    destination,
    milestones,
    loading,
    completedCount,
    totalCount,
    progressPercent,
    updateDestination,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus,
    refresh: fetchData,
  };
}