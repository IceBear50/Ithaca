import { useState } from "react";
import { AlertTriangle, Trash2, ChevronDown } from "lucide-react";
import type { Tables, TablesInsert } from "../../lib/database.types";

type Distraction = Tables<"distractions">;

const DISTRACTION_CATEGORIES = [
  "Social Media",
  "News & Articles",
  "Entertainment",
  "Email & Messages",
  "Random Browsing",
  "Phone Notifications",
  "Environmental",
  "Procrastination",
  "Other",
];

interface DistractionSectionProps {
  distractions: Distraction[];
  onCreate: (input: TablesInsert<"distractions">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DistractionSection({ distractions, onCreate, onDelete }: DistractionSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(DISTRACTION_CATEGORIES[0]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [displacedActivity, setDisplacedActivity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!durationMinutes || parseInt(durationMinutes, 10) < 1) return;
    setSubmitting(true);
    try {
      await onCreate({
        category,
        duration_minutes: parseInt(durationMinutes, 10),
        displaced_activity: displacedActivity.trim() || null,
        notes: notes.trim() || null,
      } as TablesInsert<"distractions">);
      setCategory(DISTRACTION_CATEGORIES[0]);
      setDurationMinutes("");
      setDisplacedActivity("");
      setNotes("");
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
          <h2 className="font-heading text-xl text-foreground">Distraction Log</h2>
          <p className="text-xs text-muted mt-0.5">
            {distractions.length > 0
              ? `${distractions.reduce((s, d) => s + d.duration_minutes, 0)}m total today`
              : "None logged today"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-danger border border-danger/30 hover:bg-danger/10 transition-all duration-150 cursor-pointer"
          aria-label={showForm ? "Close distraction form" : "Log distraction"}
        >
          <AlertTriangle size={16} />
          <span>Log</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-surface p-4 space-y-3 border-l-2 border-danger/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="dist-category" className="block text-xs text-muted mb-1">Category</label>
              <div className="relative">
                <select
                  id="dist-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-danger/50 transition-colors duration-150 cursor-pointer"
                >
                  {DISTRACTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="dist-duration" className="block text-xs text-muted mb-1">Duration (minutes) *</label>
              <input
                id="dist-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="15"
                className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-danger/50 transition-colors duration-150"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="dist-displaced" className="block text-xs text-muted mb-1">What it replaced?</label>
            <input
              id="dist-displaced"
              value={displacedActivity}
              onChange={(e) => setDisplacedActivity(e.target.value)}
              placeholder="e.g. Writing report, reading..."
              className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-danger/50 transition-colors duration-150"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!durationMinutes || submitting}
              className="px-3 py-1.5 rounded-lg text-sm text-bg-darker bg-danger hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Logging..." : "Log Distraction"}
            </button>
          </div>
        </form>
      )}

      {/* Distraction list */}
      {distractions.length === 0 ? (
        <div className="glass-surface p-6 flex items-center justify-center h-24">
          <p className="text-muted text-sm">No distractions logged. A clean slate — keep it up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {distractions.map((d) => (
            <div
              key={d.id}
              className="glass-surface p-3 flex items-center gap-3 border-l-2 border-danger/30 transition-all duration-150"
            >
              <AlertTriangle size={16} className="shrink-0 text-danger/70" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{d.category}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {d.duration_minutes}m
                  {d.displaced_activity && <> · replaced: {d.displaced_activity}</>}
                  {d.notes && <> · {d.notes}</>}
                </p>
              </div>
              <button
                onClick={() => onDelete(d.id)}
                className="shrink-0 p-1 text-muted hover:text-danger transition-colors duration-150 cursor-pointer"
                aria-label="Delete distraction"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}