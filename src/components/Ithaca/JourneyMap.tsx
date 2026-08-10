import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Tables } from "../../lib/database.types";

type Milestone = Tables<"milestones">;

interface JourneyMapProps {
  milestones: Milestone[];
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#C8A951",   // gold/accent
  in_progress: "#5B7FFF", // bright blue
  not_started: "#3A3F5C", // muted blue-grey
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

export default function JourneyMap({ milestones }: JourneyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 320;
    const padding = { top: 40, right: 40, bottom: 60, left: 40 };
    const innerWidth = width - padding.left - padding.right;

    // Clear previous render
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`)
       .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g")
      .attr("transform", `translate(${padding.left},${padding.top})`);

    if (milestones.length === 0) {
      // Empty state
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", height / 2 - padding.top)
        .attr("text-anchor", "middle")
        .attr("fill", "#7A7F9E")
        .attr("font-size", "14px")
        .attr("font-family", "Inter, sans-serif")
        .text("Add milestones to begin your journey");
      return;
      }

    // Generate path control points for a scenic winding route
    const n = milestones.length;
    const segmentW = innerWidth / (n + 1.5); // leave room for last point
    const points: { x: number; y: number }[] = [];

    milestones.forEach((_, i) => {
      const x = segmentW * (i + 1);
      // Alternate y positions for a scenic winding path
      const y = i % 2 === 0
        ? 60 + Math.sin(i * 1.8) * 30
        : 140 + Math.sin(i * 1.8 + 1) * 30;
      points.push({ x, y });
    });

    // Build smooth curve path
    const lineGen = d3.line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveCatmullRom);

    const pathData = lineGen(points);
    if (!pathData) return;

    // --- Draw the scenic road (background glow + main line) ---
    // Glow layer
    g.append("path")
      .attr("d", pathData)
      .attr("fill", "none")
      .attr("stroke", "oklch(0.75 0.12 85 / 20%)")
      .attr("stroke-width", 8)
      .attr("stroke-linecap", "round");

    // Main path
    const path = g.append("path")
      .attr("d", pathData)
      .attr("fill", "none")
      .attr("stroke", "#3A3F5C")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");

    // Animate path drawing
    const pathLength = path.node()?.getTotalLength() ?? 0;
    path
      .attr("stroke-dasharray", pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    // --- Draw dots along path for decoration (scenic markers) ---
    const dotCount = 20;
    for (let i = 1; i <= dotCount; i++) {
      const t = i / (dotCount + 1);
      const pt = path.node()?.getPointAtLength(t * pathLength);
      if (!pt) continue;
      g.append("circle")
        .attr("cx", pt.x)
        .attr("cy", pt.y)
        .attr("r", 1.5)
        .attr("fill", "oklch(0.75 0.12 85 / 30%)")
        .attr("opacity", 0)
        .transition()
        .delay(1500 + i * 40)
        .duration(400)
        .attr("opacity", 1);
    }

    // --- Draw milestone waypoints ---
    points.forEach((pt, i) => {
      const ms = milestones[i];
      const color = STATUS_COLORS[ms.status] || STATUS_COLORS.not_started;
      const label = STATUS_LABELS[ms.status] || "Not Started";

      // Build the waypoint node group
      const nodeGroup = g.append("g")
        .attr("class", "milestone-node-group")
        .attr("transform", `translate(${pt.x},${pt.y})`)
        .style("cursor", "pointer");

      // Outer ring glow
      nodeGroup.append("circle")
        .attr("r", 18)
        .attr("fill", ms.status === "completed" ? "oklch(0.75 0.12 85 / 15%)" : "none")
        .attr("stroke", ms.status === "completed" ? "oklch(0.75 0.12 85 / 30%)" : "none")
        .attr("stroke-width", 1);

      // Main circle
      nodeGroup.append("circle")
        .attr("r", 10)
        .attr("fill", color)
        .attr("stroke", ms.status === "not_started" ? "#5A5F7A" : "none")
        .attr("stroke-width", 1.5)
        .style("filter", ms.status === "completed" ? "drop-shadow(0 0 6px oklch(0.75 0.12 85 / 40%))" : "none");

      // Checkmark for completed
      if (ms.status === "completed") {
        nodeGroup.append("path")
          .attr("d", "M -4 0 L -1 3 L 4 -2")
          .attr("fill", "none")
          .attr("stroke", "#0A0B14")
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 0)
          .transition()
          .delay(2000 + i * 120)
          .duration(300)
          .attr("opacity", 1);
      }

      // In-progress spinner dot
      if (ms.status === "in_progress") {
        nodeGroup.append("circle")
          .attr("r", 3)
          .attr("fill", "#fff")
          .attr("opacity", 0.9);
      }

      // Title label
      nodeGroup.append("text")
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .attr("fill", "#D4D6E0")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .attr("font-family", "Inter, sans-serif")
        .text(ms.title.length > 16 ? ms.title.slice(0, 15) + "…" : ms.title);

        // Status badge
      nodeGroup.append("text")
        .attr("y", 42)
        .attr("text-anchor", "middle")
        .attr("fill", color)
        .attr("font-size", "9px")
        .attr("font-family", "Inter, sans-serif")
        .attr("font-weight", "500")
        .text(label);

      // Target date below
      if (ms.target_date) {
        const dateStr = new Date(ms.target_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        nodeGroup.append("text")
          .attr("y", 54)
          .attr("text-anchor", "middle")
          .attr("fill", "#5A5F7A")
          .attr("font-size", "8px")
          .attr("font-family", "Inter, sans-serif")
          .text(dateStr);
      }

      // Hover tooltip effect
      nodeGroup.on("mouseenter", function () {
          d3.select(this).selectAll("circle").filter((_, j, nodes) => {
            return (nodes[j] as SVGCircleElement).getAttribute("r") === "10";
          })
          .transition()
          .duration(200)
          .attr("r", 13);
        })
        .on("mouseleave", function () {
          d3.select(this).selectAll("circle").filter((_, j, nodes) => {
            return (nodes[j] as SVGCircleElement).getAttribute("r") === "13";
          })
          .transition()
          .duration(200)
          .attr("r", 10);
        });
    });

  }, [milestones]);

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ minHeight: "320px" }}
      />
    </div>
  );
}