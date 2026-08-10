import { useState } from "react";
import { Plus, Circle, CheckCircle2, SkipForward, Trash2, ChevronDown, Loader2 } from "lucide-react";
import type { Tables } from "../../lib/database.types";

type Task = Tables<"tasks">;
type Milestone = Tables<"milestones">;

const PRIORITY_STYLES: Record<string, string> = {
  high: "border-l-danger",
  medium: "border-l-accent",
  low: "border-l-tertiary",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface TaskSectionProps {
  tasks: Task[];
  milestones: Milestone[];
  onCreateTask: (input: {
    title: string;
    description?: string;
    priority: string;
    estimated_minutes?: number;
    scheduled_time?: string;
    milestone_id?: string;
  }) => Promise<void>;
  onUpdateStatus: (id: string, status: "pending" | "in_progress" | "completed" | "skipped") => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TaskSection({
  tasks,
  milestones,
  onCreateTask,
  onUpdateStatus,
  onDeleteTask,
}: TaskSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [milestoneId, setMilestoneId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
        scheduled_time: scheduledTime || undefined,
        milestone_id: milestoneId || undefined,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setEstimatedMinutes("");
      setScheduledTime("");
      setMilestoneId("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Circle size={18} className="text-muted" />;
      case "in_progress":
        return <Loader2 size={18} className="text-accent animate-spin" />;
      case "completed":
        return <CheckCircle2 size={18} className="text-success" />;
      case "skipped":
        return <SkipForward size={18} className="text-muted" />;
      default:
        return <Circle size={18} className="text-muted" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl text-foreground">Today's Tasks</h2>
          <p className="text-xs text-muted mt-0.5">
            {tasks.filter((t) => t.status !== "completed" && t.status !== "skipped").length} active
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent border border-accent/30 hover:bg-accent/10 transition-all duration-150 cursor-pointer"
          aria-label={showForm ? "Close task form" : "Add new task"}
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-surface p-4 space-y-3">
          <div>
            <label htmlFor="task-title" className="block text-xs text-muted mb-1">Title *</label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors duration-150"
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="task-desc" className="block text-xs text-muted mb-1">Description</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors duration-150 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-xs text-muted mb-1">Priority</label>
              <div className="relative">
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full appearance-none bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors duration-150 cursor-pointer"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="task-est" className="block text-xs text-muted mb-1">Est. minutes</label>
              <input
                id="task-est"
                type="number"
                min={1}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="30"
                className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors duration-150"
              />
            </div>
            <div>
              <label htmlFor="task-time" className="block text-xs text-muted mb-1">Scheduled</label>
              <input
                id="task-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors duration-150 [color-scheme:dark]"
              />
            </div>
            <div>
              <label htmlFor="task-milestone" className="block text-xs text-muted mb-1">Milestone</label>
              <div className="relative">
                <select
                  id="task-milestone"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full appearance-none bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors duration-150 cursor-pointer"
                >
                  <option value="">None</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="btn-accent text-sm px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="glass-surface p-6 flex items-center justify-center h-24">
          <p className="text-muted text-sm">No active tasks. Add one above or generate a plan.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`glass-surface p-3 flex items-center gap-3 border-l-2 ${
                PRIORITY_STYLES[task.priority] || "border-l-border"
              } transition-all duration-150`}
            >
              {/* Status toggle */}
              <button
                onClick={() => {
                  if (task.status === "pending") onUpdateStatus(task.id, "in_progress");
                  else if (task.status === "in_progress") onUpdateStatus(task.id, "completed");
                  else if (task.status === "completed") onUpdateStatus(task.id, "pending");
                }}
                className="shrink-0 hover:scale-110 transition-transform duration-150 cursor-pointer"
                aria-label={`Toggle ${task.title} status`}
                title={`Status: ${task.status}`}
              >
                {statusIcon(task.status)}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    task.status === "completed" || task.status === "skipped"
                      ? "line-through text-muted"
                      : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] uppercase tracking-wider ${
                    task.priority === "high" ? "text-danger" : task.priority === "medium" ? "text-accent" : "text-tertiary"
                  }`}>
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </span>
                  {task.estimated_minutes && (
                    <span className="text-[10px] text-muted">{task.estimated_minutes}m</span>
                  )}
                  {task.scheduled_time && (
                    <span className="text-[10px] text-muted">@{task.scheduled_time}</span>
                  )}
                  {task.milestone_id && (
                    <span className="text-[10px] text-secondary">
                      → {milestones.find((m) => m.id === task.milestone_id)?.title || "Milestone"}
                    </span>
                  )}
                </div>
              </div>

              {/* In-progress → skip */}
              {task.status === "in_progress" && (
                <button
                  onClick={() => onUpdateStatus(task.id, "skipped")}
                  className="shrink-0 p-1 text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
                  aria-label={`Skip ${task.title}`}
                  title="Skip"
                >
                  <SkipForward size={16} />
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => onDeleteTask(task.id)}
                className="shrink-0 p-1 text-muted hover:text-danger transition-colors duration-150 cursor-pointer"
                aria-label={`Delete ${task.title}`}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {/* Completed tasks summary */}
          {tasks.filter((t) => t.status === "completed").length > 0 && (
            <p className="text-xs text-muted text-center pt-1">
              {tasks.filter((t) => t.status === "completed").length} completed
            </p>
          )}
        </div>
      )}
    </div>
  );
}