import { Check } from "lucide-react";
import type { Tables } from "../../lib/database.types";

type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;

type HabitWithLog = Habit & { todayLog: HabitLog | null };

interface HabitsSectionProps {
  habits: HabitWithLog[];
  onToggle: (habitId: string, existingLog: HabitLog | null) => Promise<void>;
}

export default function HabitsSection({ habits, onToggle }: HabitsSectionProps) {
  if (habits.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-xl text-foreground">Daily Habits</h2>
          <p className="text-xs text-muted mt-0.5">Track your daily practice</p>
        </div>
        <div className="glass-surface p-6 flex items-center justify-center h-24">
          <p className="text-muted text-sm">
            No habits defined yet. Add habits during onboarding or in settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl text-foreground">Daily Habits</h2>
        <p className="text-xs text-muted mt-0.5">
          {habits.filter((h) => h.todayLog).length}/{habits.length} checked in
        </p>
      </div>

      <div className="glass-surface p-2 space-y-1">
        {habits.map((habit) => {
          const checked = !!habit.todayLog;
          return (
            <button
              key={habit.id}
              onClick={() => onToggle(habit.id, habit.todayLog)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                checked
                  ? "bg-success/10"
                  : "hover:bg-surface/50"
              }`}
              aria-label={`${checked ? "Uncheck" : "Check"} habit: ${habit.name}`}
            >
              {/* Checkbox */}
              <div
                className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
                  checked
                    ? "bg-success text-bg-darker"
                    : "border border-muted/40"
                }`}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </div>

              {/* Name + frequency */}
              <div className="flex-1 text-left">
                <p className={`text-sm ${checked ? "line-through text-muted" : "text-foreground"}`}>
                  {habit.name}
                </p>
                {habit.description && (
                  <p className="text-[11px] text-muted/60">{habit.description}</p>
                )}
              </div>

              {/* Frequency badge */}
              <span className="text-[10px] uppercase tracking-wider text-muted">
                {habit.frequency}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}