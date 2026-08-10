import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

interface MilestoneEntry {
  title: string;
  description: string;
  targetDate: string;
}

interface LifeAreaEntry {
  name: string;
  importance: number;
}

interface OnboardingData {
  destination: string;
  identity: string;
  milestones: MilestoneEntry[];
  lifeAreas: LifeAreaEntry[];
  distractions: string[];
  dailyRoutine: string;
}

const DISTRACTION_SUGGESTIONS = [
  "Social Media",
  "TV & Streaming",
  "Procrastination",
  "Video Games",
  "Phone Scrolling",
  "News & Media",
  "Daydreaming",
  "Over-Planning",
  "Perfectionism",
  "Email & Messages",
];

const EMPTY_DATA: OnboardingData = {
  destination: "",
  identity: "",
  milestones: [],
  lifeAreas: [],
  distractions: [],
  dailyRoutine: "",
};

const STEPS = [
  {
    title: "Your Destination",
    subtitle: "Where are you sailing toward?",
    description: "What is your long-term destination? And who do you want to become along the way?",
  },
  {
    title: "Milestones",
    subtitle: "Mark the key harbors along your route",
    description: "Add the major milestones that will mark your progress toward Ithaca.",
  },
  {
    title: "Life Areas",
    subtitle: "What matters most to you?",
    description: "Define the areas of life you want to track — and how important each one is to you.",
  },
  {
    title: "Your Sirens",
    subtitle: "What pulls you off course?",
    description: "Name the distractions that tempt you away from your goals.",
  },
  {
    title: "Daily Current",
    subtitle: "Where does your time go today?",
    description: "Describe your current daily routine — even roughly.  This helps us understand your starting point.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isLast = step === STEPS.length - 1;

  /* ----- helpers ----- */

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return data.destination.trim().length > 0 && data.identity.trim().length > 0;
      case 1:
        return data.milestones.length > 0;
      case 2:
        return data.lifeAreas.length > 0;
      case 3:
        return data.distractions.length > 0;
      case 4:
        return true; // daily routine is optional
      default:
        return false;
    }
  };

  /* ----- milestone helpers ----- */

  const addMilestone = () => {
    if (data.milestones.length >= 10) return;
    setData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", description: "", targetDate: "" }],
    }));
  };

  const updateMilestone = (index: number, field: keyof MilestoneEntry, value: string) => {
    setData((prev) => {
      const copy = [...prev.milestones];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, milestones: copy };
    });
  };

  const removeMilestone = (index: number) => {
    setData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  /* ----- life area helpers ----- */

  const addLifeArea = () => {
    if (data.lifeAreas.length >= 10) return;
    setData((prev) => ({
      ...prev,
      lifeAreas: [...prev.lifeAreas, { name: "", importance: 3 }],
    }));
  };

  const updateLifeArea = (index: number, field: keyof LifeAreaEntry, value: string | number) => {
    setData((prev) => {
      const copy = [...prev.lifeAreas];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, lifeAreas: copy };
    });
  };

  const removeLifeArea = (index: number) => {
    setData((prev) => ({
      ...prev,
      lifeAreas: prev.lifeAreas.filter((_, i) => i !== index),
    }));
  };

  /* ----- distraction helpers ----- */

  const toggleDistraction = (cat: string) => {
    setData((prev) => ({
      ...prev,
      distractions: prev.distractions.includes(cat)
        ? prev.distractions.filter((d) => d !== cat)
        : [...prev.distractions, cat],
    }));
  };

  const addCustomDistraction = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const val = input.value.trim();
    if (e.key === "Enter" && val && !data.distractions.includes(val)) {
      e.preventDefault();
      setData((prev) => ({ ...prev, distractions: [...prev.distractions, val] }));
      input.value = "";
    }
  };

  /* ----- save to Supabase ----- */

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Destination + identity
      const { data: dest, error: destErr } = await supabase
        .from("destinations")
        .insert({
          user_id: user.id,
          title: data.destination,
          identity: data.identity,
        })
        .select("id")
        .single();

      if (destErr) throw destErr;

      const destinationId = dest.id;

      // 2. Milestones
      if (data.milestones.length > 0) {
        const { error: milErr } = await supabase.from("milestones").insert(
          data.milestones.map((m, i) => ({
            user_id: user.id,
            destination_id: destinationId,
            title: m.title,
            description: m.description || null,
            target_date: m.targetDate || null,
            order_index: i,
            status: "pending",
          }))
        );
        if (milErr) throw milErr;
      }

      // 3. Life areas
      if (data.lifeAreas.length > 0) {
        const { error: laErr } = await supabase.from("life_areas").insert(
          data.lifeAreas.map((la) => ({
            user_id: user.id,
            name: la.name,
            importance: la.importance,
          }))
        );
        if (laErr) throw laErr;
      }

      // 4. Distraction categories (stored as navigator memory)
      if (data.distractions.length > 0) {
        const { error: distErr } = await supabase.from("navigator_memory").insert(
          data.distractions.map((cat) => ({
            user_id: user.id,
            memory_type: "distraction_category",
            content: { category: cat },
            significance: 3,
          }))
        );
        if (distErr) throw distErr;
      }

      // 5. Daily routine (stored as navigator memory)
      if (data.dailyRoutine.trim()) {
        const { error: routineErr } = await supabase.from("navigator_memory").insert({
          user_id: user.id,
          memory_type: "daily_routine",
          content: { routine: data.dailyRoutine },
          significance: 2,
        });
        if (routineErr) throw routineErr;
      }

      navigate("/voyage");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong saving your data.");
    } finally {
      setSaving(false);
    }
  };

  /* ----- render helpers ----- */

  const renderStepContent = () => {
    switch (step) {
      /* ---- Step 0: Destination + Identity ---- */
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">
                What is your Ithaca?
              </label>
              <textarea
                value={data.destination}
                onChange={(e) => update("destination", e.target.value)}
                placeholder="e.g. Build a successful company, become a published author..."
                rows={3}
                className="w-full bg-bg-darker border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">
                Who do you want to become?
              </label>
              <textarea
                value={data.identity}
                onChange={(e) => update("identity", e.target.value)}
                placeholder="e.g. A confident leader, a skilled engineer, someone who..."
                rows={3}
                className="w-full bg-bg-darker border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-150"
              />
            </div>
          </div>
        );

      /* ---- Step 1: Milestones ---- */
      case 1:
        return (
          <div className="space-y-3">
            {data.milestones.map((m, i) => (
              <div
                key={i}
                className="bg-bg-darker border border-border rounded-lg p-4 space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="absolute top-3 right-3 text-muted hover:text-danger cursor-pointer transition-colors"
                  aria-label="Remove milestone"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <input
                    value={m.title}
                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                    placeholder="Milestone title"
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
                  />
                  <input
                    type="date"
                    value={m.targetDate}
                    onChange={(e) => updateMilestone(i, "targetDate", e.target.value)}
                    className="w-40 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 [color-scheme:dark]"
                  />
                </div>
                <input
                  value={m.description}
                  onChange={(e) => updateMilestone(i, "description", e.target.value)}
                  placeholder="Optional description..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
                />
              </div>
            ))}
            {data.milestones.length < 10 && (
              <button
                type="button"
                onClick={addMilestone}
                className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Add milestone
              </button>
            )}
          </div>
        );

      /* ---- Step 2: Life Areas ---- */
      case 2:
        return (
          <div className="space-y-3">
            {data.lifeAreas.map((la, i) => (
              <div
                key={i}
                className="bg-bg-darker border border-border rounded-lg p-4 space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeLifeArea(i)}
                  className="absolute top-3 right-3 text-muted hover:text-danger cursor-pointer transition-colors"
                  aria-label="Remove life area"
                >
                  <X size={16} />
                </button>
                <input
                  value={la.name}
                  onChange={(e) => updateLifeArea(i, "name", e.target.value)}
                  placeholder="e.g. Health & Fitness"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted w-20">Importance:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateLifeArea(i, "importance", n)}
                        className={`w-8 h-8 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 ${
                          la.importance >= n
                            ? "bg-accent text-ithaca"
                            : "bg-bg border border-border text-muted hover:border-accent"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {data.lifeAreas.length < 10 && (
              <button
                type="button"
                onClick={addLifeArea}
                className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm cursor-pointer transition-colors"
              >
                <Plus size={16} />
                Add life area
              </button>
            )}
          </div>
        );

      /* ---- Step 3: Distractions ---- */
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted">Tap to select your Sirens, or type your own:</p>
            <div className="flex flex-wrap gap-2">
              {DISTRACTION_SUGGESTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleDistraction(cat)}
                  className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all duration-150 ${
                    data.distractions.includes(cat)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-bg-darker text-muted hover:border-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              onKeyDown={addCustomDistraction}
              placeholder="Type a custom distraction and press Enter..."
              className="w-full bg-bg-darker border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150"
            />
            {data.distractions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {data.distractions.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-sm"
                  >
                    {d}
                    <button
                      type="button"
                      onClick={() => toggleDistraction(d)}
                      className="hover:text-danger cursor-pointer transition-colors"
                      aria-label={`Remove ${d}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      /* ---- Step 4: Daily Routine ---- */
      case 4:
        return (
          <div className="space-y-2">
            <textarea
              value={data.dailyRoutine}
              onChange={(e) => update("dailyRoutine", e.target.value)}
              placeholder={`Describe a typical day for you — roughly is fine.

Example:
• 7:00am — Wake up, scroll phone
• 8:00am — Commute to work
• 9:00am–12:00pm — Deep work
• 12:00pm — Lunch, social media
• 1:00pm–5:00pm — Meetings & emails
• 6:00pm — TV, dinner
• 10:00pm — Bed`}
              rows={10}
              className="w-full bg-bg-darker border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-150"
            />
            <p className="text-xs text-muted">Optional — you can skip this and come back later.</p>
          </div>
        );

      default:
        return null;
    }
  };

  /* ----- main render ----- */

  return (
    <div className="min-h-screen bg-ithaca flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-accent"
                  : i < step
                    ? "w-4 bg-accent/50"
                    : "w-4 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-surface p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted">
              Step {step + 1} of {STEPS.length} &mdash; {STEPS[step].title}
            </p>
            <h2 className="font-heading text-2xl text-foreground">
              {STEPS[step].subtitle}
            </h2>
            <p className="text-muted text-sm">{STEPS[step].description}</p>
          </div>

          {renderStepContent()}

          {error && (
            <p className="text-danger text-sm text-center bg-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (step === 0) navigate("/login");
                else setStep((s) => s - 1);
              }}
              className="flex items-center gap-2 text-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <ArrowLeft size={16} />
              {step === 0 ? "Back" : "Previous"}
            </button>

            <button
              type="button"
              onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
              disabled={!canProceed() || saving}
              className="btn-accent flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                "Saving..."
              ) : isLast ? (
                "Begin Your Voyage"
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}