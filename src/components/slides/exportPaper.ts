export const EXPORT_PAPERS = ["wide", "letter", "a4"] as const;

export type ExportPaper = (typeof EXPORT_PAPERS)[number];

export const DEFAULT_EXPORT_PAPER: ExportPaper = "wide";

export function parseExportPaper(search: string | URLSearchParams): ExportPaper {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const value = params.get("paper");
  return isExportPaper(value) ? value : DEFAULT_EXPORT_PAPER;
}

export function exportUrl(path: string, paper: ExportPaper, auto = true) {
  const params = new URLSearchParams();
  if (auto) params.set("auto", "1");
  if (paper !== DEFAULT_EXPORT_PAPER) params.set("paper", paper);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function isExportPaper(value: string | null): value is ExportPaper {
  return value === "wide" || value === "letter" || value === "a4";
}
