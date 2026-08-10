import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Clock, Plus, Trash2, Zap, Target } from "lucide-react";
import type { Tables } from "../../lib/database.types";

type FocusSession = Tables<"focus_sessions">;

interface FocusSectionProps {
  sessions: FocusSession[];
  onCreateSession: (input: { title: string; planned_minutes: number }) => Promise<void>;
  onUpdateSession: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
}

export default function FocusSection({
  sessions,
  onCreateSession,
  onUpdateSession,
  onDeleteSession,
}: FocusSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [plannedMinutes, setPlannedMinutes] = useState("25");
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  const startTimer = useCallback(async (sessionId: string) => {
    setActiveTimer(sessionId);
    setElapsed(0);
    await onUpdateSession(sessionId, {
      status: "in_progress",
      started_at: new Date().toISOString(),
    });
  }, [onUpdateSession]);

  const stopTimer = useCallback(async (sessionId: string, startTime: Date) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveTimer(null);

    const now = new Date();
    const actualMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000);
    setElapsed(0);

    await onUpdateSession(sessionId, {
      status: "completed",
      ended_at: now.toISOString(),
      actual_minutes: actualMinutes,
    });
  }, [onUpdateSession]);

  // Count up for active timer
  useEffect(() => {
    if (!activeTimer) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const session = sessions.find((s) => s.id === activeTimer);
    if (!session?.started_at) return;

    const startTime = new Date(session.started_at);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer, sessions]);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !plannedMinutes) return;
    setSubmitting(true);
    try {
      await onCreateSession({
        title: title.trim(),
        planned_minutes: parseInt(plannedMinutes, 10),
      });
      setTitle("");
      setPlannedMinutes("25");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-foreground">Focus Sessions</h2>
          <p className="text-xs text-muted mt-0.5">
            {sessions.filter((s) => s.status === "completed").length} completed today
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent border border-accent/30 hover:bg-accent/10 transition-all duration-150 cursor-pointer"
          aria-label={showForm ? "Close focus form" : "Plan focus session"}
        >
          <Plus size={16} />
          <span>Plan Session</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-surface p-4 space-y-3">
          <div>
            <label htmlFor="focus-title" className="block text-xs text-muted mb-1">Session Title *</label>
            <input
              id="focus-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep work on project X"
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors duration-150"
              autoFocus
              required
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="focus-minutes" className="block text-xs text-muted mb-1">Duration (minutes)</label>
              <input
                id="focus-minutes"
                type="number"
                min={1}
                max={180}
                value={plannedMinutes}
                onChange={(e) => setPlannedMinutes(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors duration-150"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="btn-accent text-sm px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Adding..." : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="glass-surface p-6 flex items-center justify-center h-24">
          <p className="text-muted text-sm">No focus sessions yet. Plan your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isActive = activeTimer === session.id;
            const isCompleted = session.status === "completed";

            return (
              <div
                key={session.id}
                className={`glass-surface p-3 flex items-center gap-3 transition-all duration-150 ${
                  isActive ? "ring-1 ring-accent/50" : ""
                }`}
              >
                {/* Timer display or status icon */}
                <div className="shrink-0 w-12 text-center">
                  {isActive ? (
                    <span className="text-lg font-mono text-accent tabular-nums">
                      {formatElapsed(elapsed)}
                    </span>
                  ) : isCompleted ? (
                    <Clock size={20} className="text-success mx-auto" />
                  ) : (
                    <Clock size={20} className="text-muted mx-auto" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isCompleted ? "line-through text-muted" : "text-foreground"}`}>
                    {session.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted">{session.planned_minutes}m planned</span>
                    {session.actual_minutes != null && (
                      <span className="text-[10px] text-tertiary">{session.actual_minutes}m actual</span>
                    )}
                    {session.energy_level != null && (
                      <span className="text-[10px] text-accent flex items-center gap-0.5">
                        <Zap size={10} /> {session.energy_level}/5
                      </span>
                    )}
                    {session.focus_quality != null && (
                      <span className="text-[10px] text-secondary flex items-center gap-0.5">
                        <Target size={10} /> {session.focus_quality}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {session.status === "completed" && (
                    <>
                      {/* Quick energy/focus rating */}
                      <button
                        onClick={() => {
                          const energy = prompt("Energy level (1-5):");
                          if (energy && !isNaN(parseInt(energy)) && parseInt(energy) >= 1 && parseInt(energy) <= 5) {
                            onUpdateSession(session.id, { energy_level: parseInt(energy) });
                          }
                        }}
                        className="p-1.5 text-muted hover:text-accent transition-colors duration-150 cursor-pointer"
                        aria-label="Rate energy"
                        title="Rate energy (1-5)"
                      >
                        <Zap size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const focus = prompt("Focus quality (1-5):");
                          if (focus && !isNaN(parseInt(focus)) && parseInt(focus) >= 1 && parseInt(focus) <= 5) {
                            onUpdateSession(session.id, { focus_quality: parseInt(focus) });
                          }
                        }}
                        className="p-1.5 text-muted hover:text-secondary transition-colors duration-150 cursor-pointer"
                        aria-label="Rate focus"
                        title="Rate focus quality (1-5)"
                      >
                        <Target size={14} />
                      </button>
                    </>
                  )}

                  {session.status === "planned" && !isActive && (
                    <button
                      onClick={() => {
                        const s = sessions.find((x) => x.id === session.id);
                        if (s) startTimer(session.id);
                      }}
                      className="p-1.5 text-muted hover:text-success transition-colors duration-150 cursor-pointer"
                      aria-label={`Start ${session.title}`}
                      title="Start session"
                    >
                      <Play size={16} />
                    </button>
                  )}

                  {isActive && (
                    <button
                      onClick={() => {
                        const s = sessions.find((x) => x.id === session.id);
                        if (s?.started_at) stopTimer(session.id, new Date(s.started_at));
                      }}
                      className="p-1.5 text-danger hover:text-danger/80 transition-colors duration-150 cursor-pointer"
                      aria-label={`Stop ${session.title}`}
                      title="Stop session"
                    >
                      <Square size={16} />
                    </button>
                  )}

                  {!isActive && session.status !== "completed" && (
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 text-muted hover:text-danger transition-colors duration-150 cursor-pointer"
                      aria-label={`Delete ${session.title}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}