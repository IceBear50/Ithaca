import { useState } from "react";
import { Sailboat, Sun, ListTodo, Clock, Zap, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useVoyage } from "../hooks/useVoyage";
import TaskSection from "../components/voyage/TaskSection";
import FocusSection from "../components/voyage/FocusSection";
import HabitsSection from "../components/voyage/HabitsSection";
import DistractionSection from "../components/voyage/DistractionSection";

export default function VoyagePage() {
  const {
    tasks,
    habits,
    focusSessions,
    distractions,
    milestones,
    loading,
    error,
    pendingTaskCount,
    totalFocusMinutes,
    completedHabitsCount,
    totalDistractionMinutes,
    createTask,
    updateTaskStatus,
    deleteTask,
    createFocusSession,
    updateFocusSession,
    deleteFocusSession,
    toggleHabitLog,
    createDistraction,
    deleteDistraction,
  } = useVoyage();

  // Wrap hook functions to match component prop types
  const handleCreateTask = async (input: {
    title: string;
    description?: string;
    priority: string;
    estimated_minutes?: number;
    scheduled_time?: string;
    milestone_id?: string;
  }) => {
    await createTask({
      ...input,
      status: "pending",
      user_id: "", // hook overrides this
    } as any);
  };

  const handleCreateDistraction = async (input: any) => {
    await createDistraction(input);
  };

  const handleCreateFocusSession = async (input: { title: string; planned_minutes: number }) => {
    await createFocusSession({
      ...input,
      status: "planned",
      user_id: "",
    } as any);
  };

  const handleUpdateFocusSession = async (id: string, updates: Record<string, unknown>) => {
    await updateFocusSession(id, updates as any);
  };

  const [generating, setGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    // Currently a mock — will connect to navigator-morning Edge Function later
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGenerating(false);
  };

  // Today's greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  if (loading) {
    return (
      <div className="min-h-screen bg-ithaca flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-accent text-sm">
          <Sailboat size={16} />
          <span className="uppercase tracking-widest text-xs">Daily Command Center</span>
        </div>
        <h1 className="font-heading text-4xl text-foreground">
          Good {greeting}
        </h1>
        <p className="text-muted">Today's route — your priorities, tasks, and focus blocks.</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass-surface p-3 flex items-start gap-2 border-l-2 border-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-danger" />
          <p className="text-sm text-muted">
            Some data couldn't be loaded. Please refresh.
          </p>
        </div>
      )}

      {/* Today's stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Tasks", value: pendingTaskCount.toString(), icon: ListTodo, sub: "pending", color: "accent" },
          { label: "Focus Time", value: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`, icon: Clock, sub: "completed today", color: "secondary" },
          { label: "Habits", value: `${completedHabitsCount}`, icon: Sparkles, sub: "checked in", color: "success" },
          { label: "Distractions", value: totalDistractionMinutes > 0 ? `${totalDistractionMinutes}m` : "0m", icon: Zap, sub: "logged today", color: totalDistractionMinutes > 0 ? "danger" : "accent" },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div
            key={label}
            className={`glass-surface p-4 space-y-2 transition-all duration-150 hover:ring-1 hover:ring-${color}/20`}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs uppercase tracking-wider">{label}</span>
              <Icon size={16} className={`text-${color}/60`} />
            </div>
            <p className="text-2xl sm:text-3xl font-heading text-foreground">{value}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Navigator insight / Generate Plan */}
      <div className="glass-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sun size={18} className="text-accent" />
          <h2 className="font-heading text-lg text-foreground">Navigator's Insight</h2>
        </div>
        <p className="text-muted text-sm italic">
          "Generate your daily plan to see what the Navigator recommends based on your goals, habits, and recent patterns."
        </p>
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="btn-accent text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Today's Plan
            </>
          )}
        </button>
      </div>

      {/* Task Section */}
      <TaskSection
        tasks={tasks}
        milestones={milestones}
        onCreateTask={handleCreateTask}
        onUpdateStatus={updateTaskStatus}
        onDeleteTask={(id) => deleteTask(id)}
      />

      {/* Focus Sessions */}
      <FocusSection
        sessions={focusSessions}
        onCreateSession={handleCreateFocusSession}
        onUpdateSession={handleUpdateFocusSession}
        onDeleteSession={(id) => deleteFocusSession(id)}
      />

      {/* Habits Check-in */}
      <HabitsSection
        habits={habits}
        onToggle={toggleHabitLog}
      />

      {/* Distraction Log */}
      <DistractionSection
        distractions={distractions}
        onCreate={handleCreateDistraction}
        onDelete={(id) => deleteDistraction(id)}
      />
    </div>
  );
}