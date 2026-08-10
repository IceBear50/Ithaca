import { useState } from "react";
import {
  Sparkles,
  Clock,
  Brain,
  Lightbulb,
  Target,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  BookMarked,
} from "lucide-react";
import { useMirror } from "../hooks/useMirror";

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function MirrorPage() {
  const {
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
  } = useMirror();

  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  const stats = reflection
    ? {
        workPlanned: reflection.planned_work_minutes,
        workActual: reflection.actual_work_minutes,
        sessionsPlanned: reflection.planned_sessions,
        sessionsActual: reflection.actual_sessions,
        completedTasks: reflection.completed_tasks,
        missedTasks: reflection.missed_tasks,
        habitConsistency: reflection.habit_consistency,
        distractionMinutes: reflection.total_distraction_minutes,
      }
    : null;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-accent text-sm">
          <Sparkles size={16} />
          <span className="uppercase tracking-widest text-xs">Daily Reflection</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-4xl text-foreground">Mirror</h1>
        </div>
        <p className="text-muted">Planned vs actual. AI-powered daily reflection and analysis.</p>
      </div>

      {/* ── Date Navigation ────────────────────────────── */}
      <div className="flex items-center justify-between glass-surface p-3">
        <button
          onClick={goPrevDay}
          className="flex items-center gap-1 text-muted hover:text-foreground transition-colors duration-150 cursor-pointer p-1 rounded"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
          <span className="text-sm hidden sm:inline">Previous</span>
        </button>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 text-foreground font-medium text-sm hover:text-accent transition-colors duration-150 cursor-pointer"
            aria-label="Select date"
          >
            <CalendarDays size={16} className="text-accent" />
            <span>{formatDisplayDate(date)}</span>
          </button>
          {isToday && (
            <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
              Today
            </span>
          )}
          {showDatePicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDatePicker(false)}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setShowDatePicker(false);
                }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 bg-surface border border-border rounded-lg p-2 text-foreground text-sm shadow-xl"
                autoFocus
              />
            </>
          )}
        </div>

        <button
          onClick={goNextDay}
          disabled={isToday}
          className={`flex items-center gap-1 transition-colors duration-150 cursor-pointer p-1 rounded ${
            isToday
              ? "text-border cursor-not-allowed"
              : "text-muted hover:text-foreground"
          }`}
          aria-label="Next day"
        >
          <span className="text-sm hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────────── */}
      {error && (
        <div className="glass-surface p-3 flex items-start gap-2 border-l-2 border-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-danger" />
          <div className="flex-1">
            <p className="text-sm text-muted">{error}</p>
          </div>
        </div>
      )}

      {/* ── No Reflection: Empty State ──────────────────── */}
      {!reflection && !loading && (
        <div className="glass-surface p-8 sm:p-12 text-center space-y-6 border border-accent/10">
          <div className="relative inline-flex">
            <Sparkles size={48} className="text-accent/30" />
            <div className="absolute inset-0 bg-accent/5 blur-xl rounded-full" />
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            <h2 className="font-heading text-2xl text-foreground">
              {isToday ? "No Reflection Yet" : "No Reflection"}
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              {isToday
                ? "Complete a day of tasks and focus sessions, then run a reflection to see what the Navigator observed about your patterns."
                : "There is no reflection for this date. Navigate to a day where you tracked your voyage."}
            </p>
          </div>
          {isToday && (
            <button
              onClick={runReflection}
              disabled={generating || !hasTodayData}
              className="btn-accent text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mx-auto"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Reflecting...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run Evening Reflection
                </>
              )}
            </button>
          )}
          {isToday && !hasTodayData && (
            <p className="text-xs text-muted">
              Add some tasks or focus sessions today to enable reflection.
            </p>
          )}
        </div>
      )}

      {/* ── Stats Comparison — Planned vs Actual ──────── */}
      {reflection && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Work Minutes */}
            <div className="glass-surface p-5 space-y-3 border-l-2 border-accent/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">
                    Work Minutes
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {stats.workActual}
                </span>
                <span className="text-sm text-muted">
                  / {stats.workPlanned} planned
                </span>
              </div>
              <ProgressBar
                value={stats.workPlanned > 0 ? stats.workActual / stats.workPlanned : 0}
              />
            </div>

            {/* Focus Sessions */}
            <div className="glass-surface p-5 space-y-3 border-l-2 border-secondary/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-secondary" />
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">
                    Focus Sessions
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {stats.sessionsActual}
                </span>
                <span className="text-sm text-muted">
                  / {stats.sessionsPlanned} planned
                </span>
              </div>
              <ProgressBar
                value={stats.sessionsPlanned > 0 ? stats.sessionsActual / stats.sessionsPlanned : 0}
                color="secondary"
              />
            </div>

            {/* Tasks */}
            <div className="glass-surface p-5 space-y-3 border-l-2 border-tertiary/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-tertiary" />
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">
                    Tasks
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {stats.completedTasks}
                </span>
                <span className="text-sm text-muted">
                  completed
                </span>
              </div>
              {stats.missedTasks > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-danger">
                  <XCircle size={12} />
                  <span>{stats.missedTasks} missed</span>
                </div>
              )}
            </div>

            {/* Habit Consistency */}
            <div className="glass-surface p-5 space-y-3 border-l-2 border-success/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-success" />
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">
                    Habit Consistency
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {Math.round(stats.habitConsistency * 100)}%
                </span>
              </div>
              <ProgressBar value={stats.habitConsistency} color="success" />
            </div>

            {/* Distraction Minutes */}
            <div className="glass-surface p-5 space-y-3 border-l-2 border-danger/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger" />
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">
                    Distractions
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl text-foreground">
                  {stats.distractionMinutes}
                </span>
                <span className="text-sm text-muted">minutes logged</span>
              </div>
            </div>
          </div>

          {/* ── AI Analysis Section ─────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <h2 className="font-heading text-xl text-foreground">Navigator's Analysis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* What happened — Summary */}
              <AnalysisCard
                icon={Sparkles}
                label="What Happened"
                content={reflection.ai_summary}
                accent="accent"
              />

              {/* Why — Reasoning */}
              <AnalysisCard
                icon={Lightbulb}
                label="Why It May Have Happened"
                content={reflection.ai_reasoning}
                accent="secondary"
              />

              {/* One important pattern */}
              <AnalysisCard
                icon={BookMarked}
                label="One Important Pattern"
                content={reflection.ai_pattern}
                accent="tertiary"
                memories={memories}
              />

              {/* Recommendation */}
              <AnalysisCard
                icon={Target}
                label="One Recommendation for Tomorrow"
                content={reflection.ai_recommendation}
                accent="accent"
              />
            </div>
          </div>

          {/* ── Run/Re-run Reflection Button ──────────── */}
          <div className="flex items-center justify-between glass-surface p-5">
            <div className="space-y-1">
              <p className="text-sm text-foreground font-medium">
                {isToday ? "Update Today's Reflection" : "Re-run Analysis"}
              </p>
              <p className="text-xs text-muted">
                {isToday
                  ? "Ran a reflection today? You can re-run it after logging more data."
                  : "The Navigator can analyse any past day with voyage data."}
            </p>
            </div>
            <button
              onClick={runReflection}
              disabled={generating}
              className="btn-accent text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Reflecting...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Reflect
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-1
  color?: "accent" | "secondary" | "success" | "danger";
}

function ProgressBar({ value, color = "accent" }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const colorMap: Record<string, string> = {
    accent: "bg-accent",
    secondary: "bg-secondary",
    success: "bg-success",
    danger: "bg-danger",
  };

  return (
    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}

interface AnalysisCardProps {
  icon: React.ElementType;
  label: string;
  content: string | null;
  accent: string;
  memories?: { id: string; content: unknown; significance: number; memory_type: string }[];
}

function AnalysisCard({ icon: Icon, label, content, accent, memories }: AnalysisCardProps) {
  const borderClass =
    accent === "accent"
      ? "border-l-accent/40"
      : accent === "secondary"
        ? "border-l-secondary/40"
        : accent === "tertiary"
          ? "border-l-tertiary/40"
          : "border-l-success/40";

  const accentTextClass =
    accent === "accent"
      ? "text-accent"
      : accent === "secondary"
        ? "text-secondary"
        : accent === "tertiary"
          ? "text-tertiary"
          : "text-success";

  return (
    <div className={`glass-surface p-5 space-y-3 border-l-2 ${borderClass}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={accentTextClass} />
        <span className="text-xs uppercase tracking-wider text-muted font-medium">{label}</span>
      </div>
      {content ? (
        <>
          <p className="text-foreground text-sm leading-relaxed">{content}</p>
          {memories && memories.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted mb-1.5">Linked Navigator memory:</p>
              <div className="space-y-1">
                {memories.slice(0, 2).map((mem) => (
                  <div
                    key={mem.id}
                    className="flex items-start gap-1.5 text-xs"
                  >
                    <BookMarked size={10} className="text-accent/60 mt-0.5 shrink-0" />
                    <span className="text-muted italic">
                      {typeof mem.content === "object" && mem.content !== null
                        ? String(
                            ((mem.content as Record<string, unknown>)?.summary ??
                             (mem.content as Record<string, unknown>)?.pattern ??
                             JSON.stringify(mem.content)) ?? ""
                          ).slice(0, 120)
                        : String(mem.content ?? "").slice(0, 120)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted text-sm italic">Awaiting analysis...</p>
      )}
    </div>
  );
}