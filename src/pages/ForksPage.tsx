import {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  GitFork,
  Loader2,
  Clock,
  Brain,
  TrendingUp,
  History,
  AlertTriangle,
  Info,
  ChevronRight,
  BarChart3,
  ArrowRight,
  Plus,
  Minus,
} from "lucide-react";
import * as d3 from "d3";
import {
  useForks,
  SIM_VARIABLES,
  formatChangeAmount,
  simVarLabel,
} from "../hooks/useForks";
import type {
  SimulationResult,
  ScenarioOutcome,
} from "../hooks/useForks";

// ── Numeric keys of ScenarioOutcome (excludes description) ────
type NumericMetricKey = "work_minutes" | "focus_quality" | "habit_consistency_percent" | "task_completion_rate_percent";

interface MetricDef {
  key: NumericMetricKey;
  label: string;
  unit: string;
  color: string;
  baselineKey: string | null; // key into baseline object
  baselineScale: number; // if baseline value needs scaling (e.g. /10 * 100)
}

const METRICS: MetricDef[] = [
  {
    key: "work_minutes",
    label: "Study / Work",
    unit: "min",
    color: "#d4a853",
    baselineKey: "avg_daily_work_minutes",
    baselineScale: 1,
  },
  {
    key: "focus_quality",
    label: "Focus",
    unit: "/10",
    color: "#2a5c8a",
    baselineKey: "avg_focus_quality",
    baselineScale: 1,
  },
  {
    key: "habit_consistency_percent",
    label: "Habits",
    unit: "%",
    color: "#3a9d8c",
    baselineKey: null,
    baselineScale: 1,
  },
  {
    key: "task_completion_rate_percent",
    label: "Task Completion",
    unit: "%",
    color: "#7c6ab0",
    baselineKey: null,
    baselineScale: 1,
  },
];

// ── Timeframe definitions ─────────────────────────────────────
const TIMEFRAMES = [
  { key: "estimated_30d" as const, label: "30 Days", icon: Clock },
  { key: "estimated_90d" as const, label: "90 Days", icon: BarChart3 },
  { key: "estimated_180d" as const, label: "180 Days", icon: TrendingUp },
];

// ── Bar Chart Component ───────────────────────────────────────
interface BarChartProps {
  currentVal: number;
  altVal: number;
  metric: MetricDef;
  width?: number;
  height?: number;
  maxValue: number;
}

function ComparisonBar({
  currentVal,
  altVal,
  metric,
  width = 180,
  height = 70,
  maxValue,
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const pad = { top: 4, right: 4, bottom: 18, left: 4 };
    const chartW = width - pad.left - pad.right;

    const g = svg
      .append("g")
      .attr("transform", `translate(${pad.left},${pad.top})`);

    const scale = d3
      .scaleLinear()
      .domain([0, Math.max(maxValue, 1)])
      .range([0, chartW]);

    // Current bar (baseline) — dimmed
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", 12)
      .attr("rx", 3)
      .attr("fill", metric.color)
      .attr("opacity", 0.35)
      .transition()
      .duration(600)
      .delay(100)
      .attr("width", scale(currentVal));

    // Alternative bar (projected) — bright
    g.append("rect")
      .attr("x", 0)
      .attr("y", 18)
      .attr("width", 0)
      .attr("height", 12)
      .attr("rx", 3)
      .attr("fill", metric.color)
      .attr("opacity", 0.85)
      .transition()
      .duration(600)
      .delay(250)
      .attr("width", scale(altVal));

    // Current label
    g.append("text")
      .attr("x", scale(currentVal) + 4)
      .attr("y", 10)
      .attr("font-size", 9)
      .attr("fill", "#8884a0")
      .attr("opacity", 0)
      .text(currentVal)
      .transition()
      .duration(300)
      .delay(500)
      .attr("opacity", 0.9);

    // Alternative label
    g.append("text")
      .attr("x", scale(altVal) + 4)
      .attr("y", 28)
      .attr("font-size", 9)
      .attr("font-weight", 600)
      .attr("fill", metric.color)
      .attr("opacity", 0)
      .text(altVal)
      .transition()
      .duration(300)
      .delay(500)
      .attr("opacity", 1);

    // Axis line
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 34)
      .attr("x2", chartW)
      .attr("y2", 34)
      .attr("stroke", "#2a2a40")
      .attr("stroke-width", 0.5);

    // Legend: Current dot + label
    g.append("circle")
      .attr("cx", 30)
      .attr("cy", 46)
      .attr("r", 3)
      .attr("fill", metric.color)
      .attr("opacity", 0.35);

    g.append("text")
      .attr("x", 38)
      .attr("y", 49)
      .attr("font-size", 8)
      .attr("fill", "#8884a0")
      .attr("font-family", "Inter, sans-serif")
      .text("Current");

    // Arrow
    g.append("text")
      .attr("x", 72)
      .attr("y", 49)
      .attr("font-size", 8)
      .attr("fill", "#555570")
      .text("→");

    // Alternative dot + label
    g.append("circle")
      .attr("cx", 84)
      .attr("cy", 46)
      .attr("r", 3)
      .attr("fill", metric.color)
      .attr("opacity", 0.85);

    g.append("text")
      .attr("x", 92)
      .attr("y", 49)
      .attr("font-size", 8)
      .attr("fill", metric.color)
      .attr("font-family", "Inter, sans-serif")
      .text("Projected");
  }, [currentVal, altVal, metric, width, height, maxValue]);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{metric.label}</span>
        <span className="text-[10px] text-muted/60">{metric.unit}</span>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
    </div>
  );
}

// ── Timeframe Card ────────────────────────────────────────────
interface TimeframeCardProps {
  label: string;
  icon: React.ElementType;
  outcome: ScenarioOutcome | null;
  baseline: SimulationResult["baseline"];
  allOutcomes: (ScenarioOutcome | null)[];
}

function TimeframeCard({
  label,
  icon: Icon,
  outcome,
  baseline,
  allOutcomes,
}: TimeframeCardProps) {
  // Compute per-metric max across all timeframes for consistent scale
  const maxPerMetric = useMemo(() => {
    const map: Record<string, number> = {};
    METRICS.forEach((m) => {
      let mx = 0;
      // baseline value
      if (baseline && m.baselineKey) {
        const bv = baseline[m.baselineKey as keyof typeof baseline] ?? 0;
        mx = Math.max(mx, Number(bv) * m.baselineScale);
      }
      // current outcome value
      if (outcome) {
        mx = Math.max(mx, Number(outcome[m.key]));
      }
      // all timeframes
      allOutcomes.forEach((o) => {
        if (o) mx = Math.max(mx, Number(o[m.key]));
      });
      map[m.key] = Math.max(mx, 1);
    });
    return map;
  }, [outcome, baseline, allOutcomes]);

  if (!outcome) return null;

  return (
    <div className="glass-surface p-5 space-y-4 border-l-2 border-accent/30">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-accent" />
        <h3 className="text-sm font-heading text-foreground">{label}</h3>
      </div>

      <p className="text-xs text-muted italic leading-relaxed">
        &ldquo;{outcome.description}&rdquo;
      </p>

      <div className="space-y-3">
        {METRICS.map((metric) => {
          const currentVal = baseline && metric.baselineKey
            ? Number(baseline[metric.baselineKey as keyof typeof baseline]) *
              metric.baselineScale
            : Math.round(outcome[metric.key] * 0.85); // estimate baseline if not available
          const altVal = outcome[metric.key];

          return (
            <ComparisonBar
              key={metric.key}
              currentVal={currentVal}
              altVal={altVal}
              metric={metric}
              maxValue={maxPerMetric[metric.key]}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ForksPage() {
  const {
    history,
    currentResult,
    loading,
    error,
    generating,
    runSimulation,
    selectHistoryItem,
    clearCurrent,
  } = useForks();

  // ── Form state ──────────────────────────────────────────
  const [selectedVar, setSelectedVar] = useState(SIM_VARIABLES[0].variable);
  const [changeType, setChangeType] = useState<"increase" | "decrease">(
    "increase",
  );
  const [magnitude, setMagnitude] = useState(30);

  // ── Derived ─────────────────────────────────────────────
  const simVar = SIM_VARIABLES.find((v) => v.variable === selectedVar);
  const magnitudeUnit = simVar?.unit ?? "";
  const changeAmountStr = `${magnitude}`;

  const handleSimulate = useCallback(() => {
    runSimulation(selectedVar, changeType, changeAmountStr);
  }, [selectedVar, changeType, changeAmountStr, runSimulation]);

  // All outcomes across timeframes for consistent bar scaling
  const allOutcomes = useMemo(
    () =>
      currentResult
        ? [currentResult.estimated_30d, currentResult.estimated_90d, currentResult.estimated_180d]
        : [],
    [currentResult],
  );

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] bg-bg-base flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent text-sm">
            <GitFork size={16} />
            <span className="uppercase tracking-widest text-xs">
              Scenario Simulation
            </span>
          </div>
          <h1 className="font-heading text-4xl text-foreground">Forks</h1>
          <p className="text-muted max-w-lg">
            What if? Explore how changing one habit could reshape your trajectory
            across 30, 90, and 180 days.
          </p>
        </div>

        {currentResult && (
          <button
            onClick={clearCurrent}
            className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
          >
            Clear results
          </button>
        )}
      </div>

      {/* ── Simulation Controls ──────────────────────────── */}
      <div className="glass-surface p-5 space-y-5">
        <div className="flex items-center gap-2 text-accent text-xs uppercase tracking-wider">
          <Brain size={16} />
          <span>Navigator Simulation Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Variable selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="sim-variable"
              className="text-xs text-muted font-medium"
            >
              Variable
            </label>
            <select
              id="sim-variable"
              value={selectedVar}
              onChange={(e) => setSelectedVar(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              aria-label="Select variable to change"
            >
              {SIM_VARIABLES.map((v) => (
                <option key={v.variable} value={v.variable}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Change type toggle */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-medium">
              Change Type
            </label>
            <div
              className="flex rounded-lg overflow-hidden border border-border"
              role="radiogroup"
              aria-label="Increase or decrease"
            >
              <button
                onClick={() => setChangeType("increase")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                  changeType === "increase"
                    ? "bg-accent/15 text-accent"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
                role="radio"
                aria-pressed={changeType === "increase"}
                aria-label="Increase"
              >
                <Plus size={14} />
                <span>Increase</span>
              </button>
              <button
                onClick={() => setChangeType("decrease")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                  changeType === "decrease"
                    ? "bg-danger/15 text-danger"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
                role="radio"
                aria-pressed={changeType === "decrease"}
                aria-label="Decrease"
              >
                <Minus size={14} />
                <span>Decrease</span>
              </button>
            </div>
          </div>

          {/* Magnitude slider */}
          <div className="space-y-1.5">
            <label
              htmlFor="sim-magnitude"
              className="text-xs text-muted font-medium"
            >
              Magnitude
            </label>
            <div className="flex items-center gap-3">
              <input
                id="sim-magnitude"
                type="range"
                min={5}
                max={120}
                step={5}
                value={magnitude}
                onChange={(e) => setMagnitude(Number(e.target.value))}
                className="flex-1 accent-accent cursor-pointer h-1.5"
                aria-label="Magnitude slider"
              />
              <span className="text-sm text-foreground font-medium min-w-[60px] text-right tabular-nums">
                {changeType === "increase" ? "+" : "−"}
                {magnitude} {magnitudeUnit}
              </span>
            </div>
          </div>

          {/* Simulate button */}
          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={generating}
              className="w-full btn-accent text-sm inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer py-2.5"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <GitFork size={16} />
                  Simulate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────── */}
      {error && (
        <div className="glass-surface p-3 flex items-start gap-2 border-l-2 border-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-danger" />
          <p className="text-sm text-muted flex-1">{error}</p>
        </div>
      )}

      {/* ── Results Section ──────────────────────────────── */}
      {currentResult && (
        <div className="space-y-6">
          {/* Change summary */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Simulating:</span>
            <span className="text-foreground font-medium">
              {changeType === "increase" ? "Increase" : "Decrease"}{" "}
              {simVarLabel(currentResult.variable)}
            </span>
            <ChevronRight size={14} className="text-muted" />
            <span className="text-accent font-medium">
              {formatChangeAmount(
                currentResult.variable,
                currentResult.change_type,
                currentResult.change_amount,
              )}
            </span>
          </div>

          {/* AI Reasoning */}
          {currentResult.ai_reasoning && (
            <div className="glass-surface p-5 border-l-2 border-accent/40 space-y-2">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-accent" />
                <span className="text-xs uppercase tracking-wider text-muted font-medium">
                  Navigator&apos;s Reasoning
                </span>
              </div>
              <p className="text-foreground text-sm leading-relaxed italic">
                &ldquo;{currentResult.ai_reasoning}&rdquo;
              </p>
            </div>
          )}

          {/* Timeframe comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIMEFRAMES.map((tf) => {
              const outcome = currentResult[tf.key];
              return (
                <TimeframeCard
                  key={tf.key}
                  label={tf.label}
                  icon={tf.icon}
                  outcome={outcome}
                  baseline={currentResult.baseline}
                  allOutcomes={allOutcomes}
                />
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-muted/70 bg-surface/50 p-3 rounded-lg border border-border">
            <Info size={14} className="shrink-0 mt-0.5 text-accent/60" />
            <p>
              <strong className="text-muted">Important:</strong> These are
              estimates based on your historical patterns, not predictions.
              Actual results may vary. The Navigator uses your past 30 days of
              data to project potential trajectories — treat these as
              exploratory insights, not guarantees.
            </p>
          </div>
        </div>
      )}

      {/* ── Empty state (no results, no history) ─────────── */}
      {!currentResult && history.length === 0 && !loading && (
        <div className="glass-surface p-10 text-center space-y-4">
          <GitFork size={40} className="text-accent/30 mx-auto" />
          <div className="space-y-1">
            <h2 className="font-heading text-xl text-foreground">
              No Simulations Yet
            </h2>
            <p className="text-muted text-sm max-w-md mx-auto">
              Pick a variable above, choose how to change it, and let the
              Navigator simulate how that shift might reshape your days.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
            {SIM_VARIABLES.map((v) => (
              <button
                key={v.variable}
                onClick={() => setSelectedVar(v.variable)}
                className="px-2.5 py-1 rounded-full border border-border bg-surface/50 hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── History Panel ────────────────────────────────── */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent" />
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Simulation History
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => {
              const isActive = currentResult?.simulation_id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className={`glass-surface p-4 text-left space-y-2 transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "ring-1 ring-accent border-accent/30"
                      : "hover:border-accent/20"
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.change_type === "increase" ? (
                        <Plus size={12} className="text-accent" />
                      ) : (
                        <Minus size={12} className="text-danger" />
                      )}
                      <span
                        className={
                          item.change_type === "increase"
                            ? "text-accent"
                            : "text-danger"
                        }
                      >
                        {item.change_type === "increase" ? "+" : "−"}
                        {item.change_amount}
                      </span>
                    </div>
                    {isActive && (
                      <ArrowRight
                        size={12}
                        className="text-accent animate-pulse"
                      />
                    )}
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {simVarLabel(item.variable)}
                  </p>
                  <p className="text-[10px] text-muted">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}