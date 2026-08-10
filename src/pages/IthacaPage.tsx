import { useState } from "react";
import { Anchor, Plus, Trash2, Pencil, Check, X, Calendar, ArrowUpRight, MapPin, Route } from "lucide-react";
import { useIthaca } from "../hooks/useIthaca";
import JourneyMap from "../components/Ithaca/JourneyMap";
import type { Tables } from "../lib/database.types";

type MilestoneStatus = "not_started" | "in_progress" | "completed";

const STATUS_BADGE: Record<MilestoneStatus, { label: string; color: string; next: MilestoneStatus }> = {
  not_started: { label: "Not Started", color: "text-[#5A5F7A] border-[#3A3F5C]", next: "in_progress" },
  in_progress: { label: "In Progress", color: "text-[#5B7FFF] border-[#5B7FFF]/40", next: "completed" },
  completed: { label: "Completed", color: "text-accent border-accent/40", next: "completed" },
};

const NEXT_ACTION: Record<MilestoneStatus, string> = {
  not_started: "Start",
  in_progress: "Complete",
  completed: "Completed ✓",
};

export default function IthacaPage() {
  const {
    destination,
    milestones,
    loading,
    completedCount,
    totalCount,
    progressPercent,
    updateMilestone,
    updateMilestoneStatus,
    createMilestone,
    deleteMilestone,
    updateDestination,
  } = useIthaca();

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isEditingDestination, setIsEditingDestination] = useState(false);
  const [destIdentity, setDestIdentity] = useState(destination?.identity || "");
  const [destTitle, setDestTitle] = useState(destination?.title || "");

  const handleAddMilestone = async () => {
    if (!newTitle.trim()) return;
    try {
      await createMilestone({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        target_date: newTargetDate || undefined,
      });
      setNewTitle("");
      setNewDescription("");
      setNewTargetDate("");
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to create milestone:", err);
    }
  };

  const handleEdit = (ms: Tables<"milestones">) => {
    setEditingId(ms.id);
    setEditTitle(ms.title);
    setEditDescription(ms.description || "");
    setEditDate(ms.target_date ? ms.target_date.slice(0, 10) : "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateMilestone(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        target_date: editDate || null,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update milestone:", err);
    }
  };

  const handleStatusCycle = async (id: string, currentStatus: string) => {
    const next = STATUS_BADGE[currentStatus as MilestoneStatus]?.next;
    if (next && next !== currentStatus) {
      await updateMilestoneStatus(id, next);
    }
  };

  const handleSaveDestination = async () => {
    try {
      await updateDestination({
        title: destTitle.trim() || destination?.title,
        identity: destIdentity.trim() || null,
      });
      setIsEditingDestination(false);
    } catch (err) {
      console.error("Failed to update destination:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted text-sm">Charting your course...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* ===== Header ===== */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-accent text-sm">
          <Anchor size={16} />
          <span className="uppercase tracking-widest text-xs">Your Destination</span>
        </div>
        <h1 className="font-heading text-4xl text-foreground">Ithaca</h1>
        <p className="text-muted">The person you're becoming — navigate your journey one milestone at a time.</p>
      </div>

      {/* ===== Progression Indicator ===== */}
      {totalCount > 0 && (
        <div className="glass-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted">
              <span className="text-accent font-semibold">{completedCount}</span> of{" "}
              <span className="text-foreground font-semibold">{totalCount}</span> milestones complete
            </span>
            <span className="text-accent font-heading text-lg font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#1C1F33] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C8A951] to-accent rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== Destination Hero ===== */}
      <div className="glass-surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <MapPin className="text-accent" size={20} />
          {!isEditingDestination ? (
            <div className="flex-1">
              <h2 className="font-heading text-2xl text-foreground">
                {destination?.title || "Your Ithaca"}
              </h2>
              {destination?.identity && (
                <p className="text-muted italic text-sm mt-1">"{destination.identity}"</p>
              )}
              {!destination && (
                <p className="text-muted text-sm mt-1">
                  Set your destination in onboarding to define who you're becoming.
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={destTitle}
                onChange={(e) => setDestTitle(e.target.value)}
                placeholder="Destination title (e.g., Ithaca)"
                className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-foreground text-sm font-heading focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <textarea
                value={destIdentity}
                onChange={(e) => setDestIdentity(e.target.value)}
                placeholder="Identity statement — Who do you want to become?"
                rows={2}
                className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-muted text-sm italic focus:outline-none focus:ring-1 focus:ring-accent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDestination}
                  className="flex items-center gap-1 text-xs text-bg-darker bg-accent px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-all duration-150 active:scale-95"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => setIsEditingDestination(false)}
                  className="flex items-center gap-1 text-xs text-muted border border-border px-3 py-1.5 rounded-md hover:text-foreground transition-all duration-150"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}
          {!isEditingDestination && (
            <button
              onClick={() => {
                setDestIdentity(destination?.identity || "");
                setDestTitle(destination?.title || "");
                setIsEditingDestination(true);
              }}
              className="text-muted hover:text-accent transition-colors duration-150 p-1"
              title="Edit destination"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ===== D3 Journey Map ===== */}
      <div className="glass-surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Route className="text-secondary" size={20} />
          <h2 className="font-heading text-xl text-foreground">Milestone Journey</h2>
        </div>
        <JourneyMap milestones={milestones} />
      </div>

      {/* ===== Milestone Controls ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-foreground">Your Milestones</h2>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs text-bg-darker bg-accent px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-150 active:scale-95"
          >
            <Plus size={14} /> Add Milestone
          </button>
        </div>

        {/* Add milestone form */}
        {isAdding && (
          <div className="glass-surface p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What milestone marks your journey?"
              className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-foreground text-sm font-heading focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted text-xs">
                <Calendar size={14} />
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="bg-[#1C1F33] border border-border rounded px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={!newTitle.trim()}
                className="flex items-center gap-1 text-xs text-bg-darker bg-accent px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={12} /> Create
              </button>
            </div>
          </div>
        )}

        {/* Milestone List */}
        {milestones.length === 0 ? (
          <div className="glass-surface p-8 flex flex-col items-center justify-center text-center space-y-2">
            <Route className="text-muted" size={28} />
            <p className="text-muted text-sm">No milestones yet.</p>
            <p className="text-muted text-xs">Click "Add Milestone" to start charting your path forward.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((ms, idx) => (
              <div
                key={ms.id}
                className="glass-surface p-4 group hover:border-accent/20 transition-all duration-300"
              >
                {editingId === ms.id ? (
                  /* Edit mode */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-foreground text-sm font-heading focus:outline-none focus:ring-1 focus:ring-accent"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-[#1C1F33] border border-border rounded-lg px-3 py-2 text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-muted" />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-[#1C1F33] border border-border rounded px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <div className="flex-1" />
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-muted hover:text-foreground px-2 py-1 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(ms.id)}
                        className="flex items-center gap-1 text-xs text-bg-darker bg-accent px-3 py-1.5 rounded-md font-medium hover:opacity-90 active:scale-95 transition-all duration-150"
                      >
                        <Check size={12} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div>
                    <div className="flex items-start gap-3">
                      {/* Status indicator dot */}
                      <button
                        onClick={() => handleStatusCycle(ms.id, ms.status)}
                        title={`Mark as ${NEXT_ACTION[ms.status as MilestoneStatus]}`}
                        className={`mt-1.5 w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 transition-all duration-300 ${
                          ms.status === "completed"
                            ? "bg-accent border-accent shadow-[0_0_6px_oklch(0.75_0.12_85/40%)]"
                            : ms.status === "in_progress"
                            ? "bg-[#5B7FFF] border-[#5B7FFF] animate-pulse"
                            : "bg-transparent border-[#3A3F5C] group-hover:border-accent/50"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted font-mono">#{idx + 1}</span>
                          <h3 className={`font-heading text-base ${ms.status === "completed" ? "text-accent" : "text-foreground"}`}>
                            {ms.title}
                          </h3>
                          {ms.status === "completed" && <Check size={12} className="text-accent" />}
                        </div>

                        {ms.description && (
                          <p className="text-muted text-sm mt-1">{ms.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {/* Status badge */}
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[ms.status as MilestoneStatus]?.color || STATUS_BADGE.not_started.color}`}>
                            {STATUS_BADGE[ms.status as MilestoneStatus]?.label || "Not Started"}
                          </span>

                          {ms.target_date && (
                            <span className="flex items-center gap-1 text-[10px] text-muted">
                              <Calendar size={10} />
                              {new Date(ms.target_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}

                          {/* Cycle status button */}
                          {(ms.status === "not_started" || ms.status === "in_progress") && (
                            <button
                              onClick={() => handleStatusCycle(ms.id, ms.status)}
                              className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 transition-colors"
                            >
                              <ArrowUpRight size={10} />
                              {NEXT_ACTION[ms.status as MilestoneStatus]}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(ms)}
                          className="p-1.5 text-muted hover:text-accent transition-colors duration-150"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteMilestone(ms.id)}
                          className="p-1.5 text-muted hover:text-danger transition-colors duration-150"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}