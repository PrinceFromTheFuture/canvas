import type { CSSProperties } from "react";

/**
 * Pure layout math for directed acyclic graphs — a faithful port of the
 * `cursor/canvas` `computeDAGLayout` helper. Returns positioned node
 * coordinates, edge anchor points, rank bounding boxes, and back-edge flags.
 * Rendering is the caller's responsibility. Cycles are handled gracefully:
 * back-edges are detected via DFS, excluded from ranking, and flagged.
 */

export interface DAGLayoutOptions {
  nodes: Array<{ id: string }>;
  edges: Array<{ from: string; to: string }>;
  direction?: "vertical" | "horizontal";
  nodeWidth?: number;
  nodeHeight?: number;
  rankGap?: number;
  nodeGap?: number;
  padding?: number;
}

export interface DAGLayoutNode {
  id: string;
  x: number;
  y: number;
  rank: number;
  order: number;
}
export interface DAGLayoutEdge {
  from: string;
  to: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isBackEdge: boolean;
}
export interface DAGLayoutRank {
  rank: number;
  x: number;
  y: number;
  width: number;
  height: number;
  nodeIds: string[];
}
export interface DAGLayoutResult {
  nodes: DAGLayoutNode[];
  edges: DAGLayoutEdge[];
  ranks: DAGLayoutRank[];
  direction: "vertical" | "horizontal";
  width: number;
  height: number;
}

const SEP = "\u0000";

export function computeDAGLayout(options: DAGLayoutOptions): DAGLayoutResult {
  const direction = options.direction ?? "vertical";
  const nodeWidth = options.nodeWidth ?? 160;
  const nodeHeight = options.nodeHeight ?? 40;
  const rankGap = options.rankGap ?? 64;
  const nodeGap = options.nodeGap ?? 48;
  const padding = options.padding ?? 24;

  const ids = options.nodes.map((n) => n.id);
  const idSet = new Set(ids);

  const allOut = new Map<string, string[]>();
  ids.forEach((id) => allOut.set(id, []));
  for (const e of options.edges) {
    if (idSet.has(e.from) && idSet.has(e.to)) allOut.get(e.from)!.push(e.to);
  }

  // DFS to flag back-edges (gray target = part of a cycle).
  const color = new Map<string, 0 | 1 | 2>();
  ids.forEach((id) => color.set(id, 0));
  const backEdges = new Set<string>();
  const stack: Array<{ id: string; i: number }> = [];
  for (const start of ids) {
    if (color.get(start) !== 0) continue;
    stack.push({ id: start, i: 0 });
    color.set(start, 1);
    while (stack.length) {
      const frame = stack[stack.length - 1]!;
      const neighbors = allOut.get(frame.id)!;
      if (frame.i < neighbors.length) {
        const to = neighbors[frame.i++]!;
        const c = color.get(to);
        if (c === 1) backEdges.add(`${frame.id}${SEP}${to}`);
        else if (c === 0) {
          color.set(to, 1);
          stack.push({ id: to, i: 0 });
        }
      } else {
        color.set(frame.id, 2);
        stack.pop();
      }
    }
  }

  const forwardEdges = options.edges.filter(
    (e) => idSet.has(e.from) && idSet.has(e.to) && !backEdges.has(`${e.from}${SEP}${e.to}`),
  );

  // Longest-path ranking over the forward DAG (Kahn topological order).
  const indeg = new Map<string, number>();
  const fOut = new Map<string, string[]>();
  ids.forEach((id) => {
    indeg.set(id, 0);
    fOut.set(id, []);
  });
  for (const e of forwardEdges) {
    fOut.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const queue = ids.filter((id) => (indeg.get(id) ?? 0) === 0);
  const topo: string[] = [];
  const indegWork = new Map(indeg);
  while (queue.length) {
    const u = queue.shift()!;
    topo.push(u);
    for (const v of fOut.get(u)!) {
      indegWork.set(v, indegWork.get(v)! - 1);
      if (indegWork.get(v) === 0) queue.push(v);
    }
  }
  for (const id of ids) if (!topo.includes(id)) topo.push(id);

  const rank = new Map<string, number>();
  ids.forEach((id) => rank.set(id, 0));
  for (const u of topo) {
    for (const v of fOut.get(u)!) {
      if (rank.get(v)! < rank.get(u)! + 1) rank.set(v, rank.get(u)! + 1);
    }
  }

  const maxRank = ids.reduce((m, id) => Math.max(m, rank.get(id)!), 0);
  const byRank: string[][] = Array.from({ length: maxRank + 1 }, () => []);
  for (const id of ids) byRank[rank.get(id)!]!.push(id);

  const vertical = direction !== "horizontal";
  const maxCount = byRank.reduce((m, r) => Math.max(m, r.length), 1);
  const crossSpan = maxCount * (vertical ? nodeWidth : nodeHeight) + (maxCount - 1) * nodeGap;

  const pos = new Map<string, DAGLayoutNode>();
  const ranks: DAGLayoutRank[] = [];

  byRank.forEach((rankNodes, r) => {
    const count = rankNodes.length;
    const span = count * (vertical ? nodeWidth : nodeHeight) + (count - 1) * nodeGap;
    const crossStart = padding + (crossSpan - span) / 2;
    const mainPos = padding + r * ((vertical ? nodeHeight : nodeWidth) + rankGap);
    rankNodes.forEach((id, order) => {
      const cross = crossStart + order * ((vertical ? nodeWidth : nodeHeight) + nodeGap);
      const x = vertical ? cross : mainPos;
      const y = vertical ? mainPos : cross;
      pos.set(id, { id, x, y, rank: r, order });
    });
    ranks.push({
      rank: r,
      x: vertical ? padding : mainPos,
      y: vertical ? mainPos : padding,
      width: vertical ? crossSpan : nodeWidth,
      height: vertical ? nodeHeight : crossSpan,
      nodeIds: rankNodes.slice(),
    });
  });

  const outNodes = ids.map((id) => pos.get(id)!).filter(Boolean);

  const outEdges: DAGLayoutEdge[] = options.edges
    .filter((e) => pos.has(e.from) && pos.has(e.to))
    .map((e) => {
      const s = pos.get(e.from)!;
      const t = pos.get(e.to)!;
      const isBackEdge = backEdges.has(`${e.from}${SEP}${e.to}`);
      const source = vertical
        ? { x: s.x + nodeWidth / 2, y: s.y + nodeHeight }
        : { x: s.x + nodeWidth, y: s.y + nodeHeight / 2 };
      const target = vertical
        ? { x: t.x + nodeWidth / 2, y: t.y }
        : { x: t.x, y: t.y + nodeHeight / 2 };
      return { from: e.from, to: e.to, sourceX: source.x, sourceY: source.y, targetX: target.x, targetY: target.y, isBackEdge };
    });

  const mainExtent = padding * 2 + (maxRank + 1) * (vertical ? nodeHeight : nodeWidth) + maxRank * rankGap;
  const crossExtent = padding * 2 + crossSpan;

  return {
    nodes: outNodes,
    edges: outEdges,
    ranks,
    direction,
    width: vertical ? crossExtent : mainExtent,
    height: vertical ? mainExtent : crossExtent,
  };
}

/** Shallow-merge two style objects with `override` taking precedence. */
export function mergeStyle(base: CSSProperties, override?: CSSProperties): CSSProperties {
  return override ? { ...base, ...override } : { ...base };
}
