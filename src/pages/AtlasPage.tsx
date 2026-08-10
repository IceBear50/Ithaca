import { useRef, useEffect, useState, useMemo } from "react";
import {
  Map,
  Brain,
  TrendingUp,
  AlertCircle,
  Loader2,
  Sparkles,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";
import * as d3 from "d3";
import {
  useAtlas,
  VARIABLES,
  observationsToLinks,
} from "../hooks/useAtlas";
import type { AtlasLink } from "../hooks/useAtlas";
import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

// ── Types for D3 force simulation ──────────────────────────
interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  color: string;
  variable: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  relationship_type: "positive" | "negative" | "neutral";
  strength: number;
  evidence_summary: string | null;
  data_points: number;
  id: string;
}

// ── Color maps ─────────────────────────────────────────────
const EDGE_COLORS: Record<string, string> = {
  positive: "#4a9d6a",
  negative: "#c45a5a",
  neutral: "#555570",
};

const GLOW_FILTER = (
  <defs>
    <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="node-glow-dim" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ── Relationship description helper ────────────────────────
function describeRelationship(type: string, strength: number): string {
  const intensity =
    strength > 0.7 ? "strong" : strength > 0.4 ? "moderate" : "weak";
  if (type === "positive") return `${intensity} positive correlation`;
  if (type === "negative") return `${intensity} negative correlation`;
  return `${intensity} neutral relationship`;
}

function cautiousText(type: string): string {
  if (type === "positive")
    return "Your data suggests these two variables tend to move together.";
  if (type === "negative")
    return "A pattern we observed — when one increases, the other tends to decrease.";
  return "This may indicate these variables don't strongly influence each other in your data.";
}

// ── Main Component ─────────────────────────────────────────
export default function AtlasPage() {
  const {
    observations,
    loading,
    error,
    generating,
    analysisSummary,
    runAnalysis,
  } = useAtlas();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<AtlasLink[]>([]);

  // Refs for D3 event handlers to avoid stale closures
  const selectedNodeIdRef = useRef(selectedNodeId);
  const selectedLinksRef = useRef(selectedLinks);
  const linksRef = useRef<AtlasLink[]>([]);
  selectedNodeIdRef.current = selectedNodeId;
  selectedLinksRef.current = selectedLinks;

  // Convert observations to links
  const links = useMemo(() => observationsToLinks(observations), [observations]);
  linksRef.current = links;

  // Build sim nodes from VARIABLES
  const simNodes: SimNode[] = useMemo(
    () =>
      VARIABLES.map((v) => ({
        id: v.variable,
        label: v.label,
        color: v.color,
        variable: v.variable,
      })),
    [],
  );

  // Build sim links from AtlasLink array
  const simLinks: SimLink[] = useMemo(
    () =>
      links.map((l) => ({
        source: l.source,
        target: l.target,
        relationship_type: l.relationship_type,
        strength: l.strength,
        evidence_summary: l.evidence_summary,
        data_points: l.data_points,
        id: l.id,
      })),
    [links],
  );

  // Stats
  const correlationsCount = links.length;
  const totalDataPoints = useMemo(
    () => observations.reduce((sum, o) => sum + o.data_points, 0),
    [observations],
  );

  // ── SVG Container ref for D3 ─────────────────────────────
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  // ── D3 Force Simulation ──────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 700;
    const height = Math.max(500, Math.min(600, width * 0.65));
    const svg = d3.select(svgRef.current);

    // Clear previous render
    svg.selectAll("g.graph-layer").remove();

    const graphLayer = svg.append("g").attr("class", "graph-layer");

    // ── Zoom behaviour ──
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on("zoom", (event) => {
        graphLayer.attr("transform", event.transform);
      });

    svg.call(zoom);

    // ── Arrow markers ──
    const defsEl = svg.select("defs");
    defsEl
      .append("marker")
      .attr("id", "arrow-positive")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", EDGE_COLORS.positive);

    defsEl
      .append("marker")
      .attr("id", "arrow-negative")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", EDGE_COLORS.negative);

    defsEl
      .append("marker")
      .attr("id", "arrow-neutral")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", EDGE_COLORS.neutral);

    // ── Edges (links) ──
    const linkGroup = graphLayer.append("g").attr("class", "links");

    const linkElements = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(simLinks, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("stroke", (d) => EDGE_COLORS[d.relationship_type])
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 0)
            .call((sel) =>
              sel
                .transition()
                .duration(600)
                .attr("stroke-width", (d) => Math.max(1, d.strength * 4))
            ),
        (update) =>
          update.call((sel) =>
            sel
              .transition()
              .duration(400)
              .attr("stroke", (d) => EDGE_COLORS[d.relationship_type])
              .attr("stroke-width", (d) => Math.max(1, d.strength * 4))
              .attr("stroke-opacity", 0.6)
          ),
        (exit) =>
          exit.call((sel) =>
            sel.transition().duration(300).attr("stroke-opacity", 0).remove()
          ),
      );

    // ── Edge labels ──
    const labelGroup = graphLayer.append("g").attr("class", "edge-labels");

    labelGroup
      .selectAll<SVGTextElement, SimLink>("text")
      .data(simLinks, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append("text")
            .text((d) =>
              d.relationship_type === "positive"
                ? "+"
                : d.relationship_type === "negative"
                  ? "−"
                  : "∼"
            )
            .attr("font-size", 10)
            .attr("fill", (d) => EDGE_COLORS[d.relationship_type])
            .attr("text-anchor", "middle")
            .attr("dy", -6)
            .attr("opacity", 0)
            .call((sel) =>
              sel.transition().duration(600).attr("opacity", 0.7)
            ),
        (update) =>
          update.call((sel) =>
            sel
              .transition()
              .duration(400)
              .attr("fill", (d) => EDGE_COLORS[d.relationship_type])
          ),
        (exit) =>
          exit.call((sel) =>
            sel.transition().duration(300).attr("opacity", 0).remove()
          ),
      );

    // ── Nodes (groups) ──
    const nodeGroup = graphLayer.append("g").attr("class", "nodes");

    const nodeElements = nodeGroup
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes, (d) => d.id)
      .join(
        (enter) => {
          const g = enter.append("g").attr("cursor", "pointer");
          g.append("circle")
            .attr("class", "glow-circle")
            .attr("r", 24)
            .attr("fill", (d) => d.color)
            .attr("opacity", 0.15)
            .attr("filter", "url(#node-glow)");
          g.append("circle")
            .attr("class", "main-circle")
            .attr("r", 14)
            .attr("fill", (d) => d.color)
            .attr("stroke", (d) => d.color)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.6)
            .attr("opacity", 1);
          g.append("text")
            .text((d) => d.label)
            .attr("text-anchor", "middle")
            .attr("dy", 30)
            .attr("fill", "#e8e6e3")
            .attr("font-size", 11)
            .attr("font-family", "Inter, sans-serif")
            .attr("font-weight", 500)
            .attr("opacity", 0.85);
          return g;
        },
        (update) =>
          update.call((sel) =>
            sel.transition().duration(400).attr("opacity", 1)
          ),
        (exit) =>
          exit.call((sel) =>
            sel.transition().duration(300).attr("opacity", 0).remove()
          ),
      );

    // ── Click & hover events ──
    nodeElements.on("click", function (event, d) {
      event.stopPropagation();
      const currentId = selectedNodeIdRef.current;
      if (currentId === d.id) {
        setSelectedNodeId(null);
        setSelectedLinks([]);
      } else {
        setSelectedNodeId(d.id);
        const connected = linksRef.current.filter(
          (l) => l.source === d.id || l.target === d.id,
        );
        setSelectedLinks(connected);
      }
    });

    // Click on background to deselect
    svg.on("click", () => {
      setSelectedNodeId(null);
      setSelectedLinks([]);
    });

    // ── Force simulation ──
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(100)
          .strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(40));

    simulationRef.current = simulation;

    simulation.on("tick", () => {
      linkElements
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      nodeElements.attr(
        "transform",
        (d) => `translate(${d.x ?? 0},${d.y ?? 0})`,
      );
    });

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simNodes.length, simLinks.length, simLinks.map((l) => l.id).join(",")]);

  // ── Update highlights when selection changes ─────────────
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    const allNodes = svg.selectAll<SVGGElement, SimNode>(".nodes g");
    const allLinks = svg.selectAll<SVGLineElement, SimLink>(".links line");

    if (selectedNodeId) {
      const connectedIds = new Set<string>();
      connectedIds.add(selectedNodeId);
      selectedLinks.forEach((l) => {
        connectedIds.add(l.source);
        connectedIds.add(l.target);
      });

      allNodes.each(function (d) {
        const isConnected = connectedIds.has(d.id);
        const isSelected = d.id === selectedNodeId;
        d3.select(this)
          .select(".main-circle")
          .transition()
          .duration(300)
          .attr("r", isSelected ? 18 : isConnected ? 14 : 10)
          .attr("opacity", isConnected ? 1 : 0.25);

        d3.select(this)
          .select(".glow-circle")
          .transition()
          .duration(300)
          .attr("opacity", isConnected ? 0.25 : 0.05);

        d3.select(this)
          .select("text")
          .transition()
          .duration(300)
          .attr("opacity", isConnected ? 0.85 : 0.2);
      });

      allLinks
        .transition()
        .duration(300)
        .attr("stroke-opacity", (d) =>
          connectedIds.has((d.source as SimNode).id) &&
          connectedIds.has((d.target as SimNode).id)
            ? 0.9
            : 0.08,
        );
    } else {
      allNodes.each(function () {
        d3.select(this)
          .select(".main-circle")
          .transition()
          .duration(300)
          .attr("r", 14)
          .attr("opacity", 1);

        d3.select(this)
          .select(".glow-circle")
          .transition()
          .duration(300)
          .attr("opacity", 0.15);

        d3.select(this)
          .select("text")
          .transition()
          .duration(300)
          .attr("opacity", 0.85);
      });

      allLinks
        .transition()
        .duration(300)
        .attr("stroke-opacity", 0.6);
    }
  }, [selectedNodeId, selectedLinks]);

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] bg-bg-base flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent text-sm">
            <Map size={16} />
            <span className="uppercase tracking-widest text-xs">
              Behavioral Pattern Map
            </span>
          </div>
          <h1 className="font-heading text-4xl text-foreground">Atlas</h1>
          <p className="text-muted max-w-lg">
            Visual relationships between your behavioral variables. Your data
            suggests patterns emerge when you track consistently.
          </p>
        </div>

        <button
          onClick={runAnalysis}
          disabled={generating}
          className="btn-accent text-sm inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain size={16} />
              Analyze Patterns
            </>
          )}
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────────── */}
      {error && (
        <div className="glass-surface p-3 flex items-start gap-2 border-l-2 border-danger">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-danger" />
          <p className="text-sm text-muted flex-1">{error}</p>
        </div>
      )}

      {/* ── Stats Row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Correlations Detected"
          value={correlationsCount}
          icon={TrendingUp}
          accent="accent"
        />
        <StatCard
          label="Data Points"
          value={totalDataPoints}
          icon={AlertCircle}
          accent="secondary"
        />
        <StatCard
          label="Variables Tracked"
          value={VARIABLES.length}
          icon={Activity}
          accent="tertiary"
        />
        <StatCard
          label="Days Analyzed"
          value={analysisSummary ? 14 : 0}
          icon={Info}
          accent="accent"
          subtitle={analysisSummary ? "last 14 days" : "run analysis to start"}
        />
      </div>

      {/* ── Analysis Summary ────────────────────────────── */}
      {analysisSummary && (
        <div className="glass-surface p-5 border-l-2 border-accent/40 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Navigator&apos;s Summary
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed italic">
            &ldquo;{analysisSummary}&rdquo;
          </p>
        </div>
      )}

      {/* ── Graph + Evidence Panel ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* D3 Graph */}
        <div
          ref={containerRef}
          className="glass-surface p-0 overflow-hidden xl:col-span-3 relative"
          style={{ minHeight: 500 }}
        >
          {/* Legend */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#4a9d6a] rounded-full" />
              <span className="text-muted">Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#c45a5a] rounded-full" />
              <span className="text-muted">Negative</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#555570] rounded-full" />
              <span className="text-muted">Neutral</span>
            </div>
          </div>

          {/* Legend: relationship symbols */}
          <div className="absolute top-4 right-4 z-10 flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[#4a9d6a] font-bold">+</span>
              <span className="text-muted">strengthens</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#c45a5a] font-bold">&minus;</span>
              <span className="text-muted">weakens</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#555570]">&#8764;</span>
              <span className="text-muted">neutral</span>
            </div>
          </div>

          {/* Empty state overlay */}
          {observations.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center space-y-3 max-w-xs">
                <Activity
                  size={40}
                  className="text-muted/30 mx-auto"
                />
                <p className="text-muted text-sm">
                  No patterns detected yet. Track your daily voyage and run an
                  analysis to see behavioral relationships emerge.
                </p>
              </div>
            </div>
          )}

          {/* Generating overlay */}
          {generating && (
            <div className="absolute inset-0 bg-bg-base/60 flex items-center justify-center z-20 backdrop-blur-sm">
              <div className="text-center space-y-3">
                <Loader2
                  size={36}
                  className="text-accent animate-spin mx-auto"
                />
                <p className="text-foreground text-sm font-medium">
                  The Navigator is analyzing your patterns...
                </p>
                <p className="text-muted text-xs">
                  Reviewing your last 14 days of data
                </p>
              </div>
            </div>
          )}

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ minHeight: 500, display: "block" }}
            className="cursor-grab active:cursor-grabbing"
          >
            {GLOW_FILTER}
          </svg>
        </div>

        {/* Evidence Panel */}
        <div className="xl:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-accent" />
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              {selectedNodeId ? "Relationship Details" : "Evidence Panel"}
            </span>
          </div>

          {selectedNodeId && selectedLinks.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {selectedLinks.map((link) => {
                const varA = VARIABLES.find((v) => v.variable === link.source);
                const varB = VARIABLES.find((v) => v.variable === link.target);

                return (
                  <div
                    key={link.id}
                    className="glass-surface p-4 space-y-3 border-l-2"
                    style={{
                      borderLeftColor: EDGE_COLORS[link.relationship_type],
                    }}
                  >
                    {/* Relationship header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              EDGE_COLORS[link.relationship_type],
                          }}
                        />
                        <span className="text-sm text-foreground font-medium">
                          {varA?.label ?? link.source}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: EDGE_COLORS[link.relationship_type],
                          }}
                        >
                          {link.relationship_type === "positive"
                            ? "→"
                            : link.relationship_type === "negative"
                              ? "→"
                              : "↔"}
                        </span>
                        <span className="text-sm text-foreground font-medium">
                          {varB?.label ?? link.target}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {describeRelationship(
                          link.relationship_type,
                          link.strength,
                        )}{" "}
                        &middot;{" "}
                        {Math.round(link.strength * 100)}% strength
                      </p>
                    </div>

                    {/* Evidence summary */}
                    {link.evidence_summary ? (
                      <div className="space-y-2">
                        <p className="text-xs text-foreground/80 leading-relaxed italic">
                          &ldquo;{link.evidence_summary}&rdquo;
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted">
                          <Activity size={11} />
                          <span>{link.data_points} days of data support this</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic">
                        {cautiousText(link.relationship_type)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-surface p-6 text-center space-y-2">
              <Info size={24} className="text-muted/30 mx-auto" />
              <p className="text-xs text-muted leading-relaxed">
                {selectedNodeId
                  ? "No relationships found for this variable."
                  : "Click any variable node on the graph to see its behavioral relationships and evidence."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Variable Legend ──────────────────────────────── */}
      <div className="glass-surface p-5">
        <div className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
          Tracked Variables
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {VARIABLES.map((v) => (
            <div key={v.variable} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: v.color }}
              />
              <span className="text-xs text-foreground/70">{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── StatCard Sub-component ──────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  subtitle?: string;
}

function StatCard({ label, value, icon: Icon, accent, subtitle }: StatCardProps) {
  const borderClass =
    accent === "accent"
      ? "border-l-accent/40"
      : accent === "secondary"
        ? "border-l-secondary/40"
        : accent === "tertiary"
          ? "border-l-tertiary/40"
          : "border-l-success/40";

  return (
    <div className={`glass-surface p-4 space-y-2 border-l-2 ${borderClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs uppercase tracking-wider">
          {label}
        </span>
        <Icon size={16} className="text-accent/60" />
      </div>
      <p className="text-3xl font-heading text-foreground">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted">{subtitle}</p>
      )}
    </div>
  );
}