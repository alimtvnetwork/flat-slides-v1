export type PaginationSlot =
  | { kind: "number"; n: number }
  | { kind: "ellipsis"; id: "left" | "right"; range: [number, number] };

const DEFAULT_NEIGHBORS = 2;

const numberSlot = (n: number): PaginationSlot => ({ kind: "number", n });

const sequence = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

const bounded = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function visibleNumbers(current: number, total: number, neighbors: number) {
  const start = bounded(current - neighbors, 2, total - 1);
  const end = bounded(current + neighbors, 2, total - 1);
  return [...new Set([1, ...sequence(start, end), total])].filter((n) => n >= 1 && n <= total);
}

function collapsedSlot(left: number, right: number, current: number): PaginationSlot[] {
  const start = left + 1;
  const end = right - 1;
  if (start > end) return [];
  if (start === end) return [numberSlot(start)];
  return [{ kind: "ellipsis", id: end < current ? "left" : "right", range: [start, end] }];
}

export function buildPaginationSlots(
  current: number,
  total: number,
  threshold: number,
  neighbors = DEFAULT_NEIGHBORS,
): PaginationSlot[] {
  if (total <= threshold) return sequence(1, total).map(numberSlot);
  return visibleNumbers(current, total, neighbors).flatMap((n, i, visible) =>
    i === 0 ? [numberSlot(n)] : [...collapsedSlot(visible[i - 1], n, current), numberSlot(n)],
  );
}