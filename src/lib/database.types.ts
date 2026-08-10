export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      behavior_observations: {
        Row: {
          created_at: string
          data_points: number
          evidence_summary: string | null
          id: string
          relationship_type: string
          strength: number
          user_id: string
          variable_a: string
          variable_b: string
        }
        Insert: {
          created_at?: string
          data_points?: number
          evidence_summary?: string | null
          id?: string
          relationship_type: string
          strength?: number
          user_id: string
          variable_a: string
          variable_b: string
        }
        Update: {
          created_at?: string
          data_points?: number
          evidence_summary?: string | null
          id?: string
          relationship_type?: string
          strength?: number
          user_id?: string
          variable_a?: string
          variable_b?: string
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          ai_insight: Json | null
          created_at: string
          date: string
          id: string
          navigator_generated: boolean
          user_id: string
        }
        Insert: {
          ai_insight?: Json | null
          created_at?: string
          date: string
          id?: string
          navigator_generated?: boolean
          user_id: string
        }
        Update: {
          ai_insight?: Json | null
          created_at?: string
          date?: string
          id?: string
          navigator_generated?: boolean
          user_id?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          created_at: string
          id: string
          identity: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identity?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identity?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distractions: {
        Row: {
          category: string
          created_at: string
          date: string
          displaced_activity: string | null
          duration_minutes: number
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          displaced_activity?: string | null
          duration_minutes: number
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          displaced_activity?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_minutes: number | null
          created_at: string
          ended_at: string | null
          energy_level: number | null
          focus_quality: number | null
          id: string
          milestone_id: string | null
          planned_minutes: number
          started_at: string | null
          status: string
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string
          ended_at?: string | null
          energy_level?: number | null
          focus_quality?: number | null
          id?: string
          milestone_id?: string | null
          planned_minutes: number
          started_at?: string | null
          status?: string
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string
          ended_at?: string | null
          energy_level?: number | null
          focus_quality?: number | null
          id?: string
          milestone_id?: string | null
          planned_minutes?: number
          started_at?: string | null
          status?: string
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          count: number
          created_at: string
          date: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          date: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          description: string | null
          frequency: string
          id: string
          life_area_id: string | null
          name: string
          target_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          life_area_id?: string | null
          name: string
          target_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          life_area_id?: string | null
          name?: string
          target_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_life_area_id_fkey"
            columns: ["life_area_id"]
            isOneToOne: false
            referencedRelation: "life_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      life_areas: {
        Row: {
          created_at: string
          id: string
          importance: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          importance?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          importance?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          description: string | null
          destination_id: string | null
          id: string
          order_index: number
          status: string
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          order_index?: number
          status?: string
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destination_id?: string | null
          id?: string
          order_index?: number
          status?: string
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      navigator_memory: {
        Row: {
          content: Json
          created_at: string
          id: string
          last_accessed: string
          memory_type: string
          significance: number
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          last_accessed?: string
          memory_type: string
          significance?: number
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          last_accessed?: string
          memory_type?: string
          significance?: number
          user_id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          actual_sessions: number
          actual_work_minutes: number
          ai_pattern: string | null
          ai_reasoning: string | null
          ai_recommendation: string | null
          ai_summary: string | null
          completed_tasks: number
          created_at: string
          date: string
          habit_consistency: number
          id: string
          missed_tasks: number
          planned_sessions: number
          planned_work_minutes: number
          raw_ai_response: Json | null
          total_distraction_minutes: number
          user_id: string
        }
        Insert: {
          actual_sessions?: number
          actual_work_minutes?: number
          ai_pattern?: string | null
          ai_reasoning?: string | null
          ai_recommendation?: string | null
          ai_summary?: string | null
          completed_tasks?: number
          created_at?: string
          date: string
          habit_consistency?: number
          id?: string
          missed_tasks?: number
          planned_sessions?: number
          planned_work_minutes?: number
          raw_ai_response?: Json | null
          total_distraction_minutes?: number
          user_id: string
        }
        Update: {
          actual_sessions?: number
          actual_work_minutes?: number
          ai_pattern?: string | null
          ai_reasoning?: string | null
          ai_recommendation?: string | null
          ai_summary?: string | null
          completed_tasks?: number
          created_at?: string
          date?: string
          habit_consistency?: number
          id?: string
          missed_tasks?: number
          planned_sessions?: number
          planned_work_minutes?: number
          raw_ai_response?: Json | null
          total_distraction_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      scenario_simulations: {
        Row: {
          ai_reasoning: string | null
          change_amount: string
          change_type: string
          created_at: string
          estimated_180d: Json | null
          estimated_30d: Json | null
          estimated_90d: Json | null
          id: string
          user_id: string
          variable: string
        }
        Insert: {
          ai_reasoning?: string | null
          change_amount: string
          change_type: string
          created_at?: string
          estimated_180d?: Json | null
          estimated_30d?: Json | null
          estimated_90d?: Json | null
          id?: string
          user_id: string
          variable: string
        }
        Update: {
          ai_reasoning?: string | null
          change_amount?: string
          change_type?: string
          created_at?: string
          estimated_180d?: Json | null
          estimated_30d?: Json | null
          estimated_90d?: Json | null
          id?: string
          user_id?: string
          variable?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          created_at: string
          daily_plan_id: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          milestone_id: string | null
          priority: string
          scheduled_time: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          daily_plan_id?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string
          scheduled_time?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          created_at?: string
          daily_plan_id?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never