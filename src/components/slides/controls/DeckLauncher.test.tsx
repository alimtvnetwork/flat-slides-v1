import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Deck } from "../types";

const ioMocks = vi.hoisted(() => ({
  exportDeck: vi.fn(),
  parseDeckJson: vi.fn(),
  pickJsonFile: vi.fn(),
}));

type MockLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
};

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, params, children, ...props }: MockLinkProps) => (
    <a href={routeHref(to, params)} {...props}>{children}</a>
  ),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/lib/slides/io", () => ioMocks);

import { DeckLauncher } from "./DeckLauncher";
import { onSlidesEvent } from "../telemetry";
import { useDeck } from "../store";

const expectedLinks = [
  ["Inspector", "/slides/inspector/1"],
  ["Handout", "/slides/handout"],
  ["3-up", "/slides/handout-3up"],
  ["Print", "/slides/print"],
  ["Overview", "/slides"],
];

describe("DeckLauncher", () => {
  it("renders every launcher case with the expected target", () => {
    render(<DeckLauncher onOpenSettings={vi.fn()} onPresent={vi.fn()} />);

    for (const label of ["Present", "Import", "Export", "Settings"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    for (const [label, href] of expectedLinks) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("emits telemetry and invokes the present/settings actions", () => {
    const events: string[] = [];
    const off = onSlidesEvent((detail) => {
      if (detail.type === "home-launcher-click") events.push(detail.action);
    });
    const onPresent = vi.fn();
    const onOpenSettings = vi.fn();

    render(<DeckLauncher onOpenSettings={onOpenSettings} onPresent={onPresent} />);
    fireEvent.click(screen.getByRole("button", { name: "Present" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(events).toEqual(["present", "settings"]);
    expect(onPresent).toHaveBeenCalledOnce();
    expect(onOpenSettings).toHaveBeenCalledOnce();
    off();
  });

  it("logs import/export launcher clicks before running IO", async () => {
    const events: string[] = [];
    const off = onSlidesEvent((detail) => {
      if (detail.type === "home-launcher-click") events.push(detail.action);
    });
    ioMocks.pickJsonFile.mockResolvedValue(null);
    const deck = useDeck.getState().deck;

    render(<DeckLauncher onOpenSettings={vi.fn()} onPresent={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    await vi.waitFor(() => expect(ioMocks.pickJsonFile).toHaveBeenCalledOnce());
    expect(ioMocks.exportDeck).toHaveBeenCalledWith(deck satisfies Deck);
    expect(events).toEqual(["import", "export"]);
    off();
  });
});

function routeHref(to: string, params?: Record<string, string>) {
  if (!params) return to;
  return Object.entries(params).reduce((href, [key, value]) => href.replace(`$${key}`, value), to);
}