import { HelpCircle, MonitorPlay, MoreHorizontal, Settings } from "lucide-react";

import { useSlideNumber } from "./useSlideNumber";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MusicToggle } from "./MusicToggle";
import { ThemeChip } from "./ThemeChip";

interface Props {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

/**
 * Overflow menu (⋯) that hosts secondary controller actions on narrow
 * viewports (<1280px). Theme + Music are rendered inline inside the
 * popover so their own popovers still work.
 */
export function ControllerOverflowMenu({ onOpenSettings, onOpenHelp }: Props) {
  const slideNumber = useSlideNumber();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="More controls"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--ctrl-fg)] transition-colors hover:bg-white/10"
      >
        <MoreHorizontal size={15} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[180px] border-[color:var(--ctrl-border)] bg-[color:var(--ctrl-bg)] text-[color:var(--ctrl-fg)] backdrop-blur-md"
      >
        <div className="flex items-center gap-1 px-2 py-1.5">
          <ThemeChip />
          <MusicToggle compact />
        </div>
        <DropdownMenuItem onSelect={() => openInspectorWindow(slideNumber)} className="gap-2">
          <MonitorPlay size={14} /> Open inspector
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenSettings} className="gap-2">
          <Settings size={14} /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenHelp} className="gap-2">
          <HelpCircle size={14} /> Keyboard shortcuts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function openInspectorWindow(slideNumber: number) {
  if (typeof window === "undefined") return;
  const url = `${window.location.origin}/slides/inspector/${slideNumber}`;
  window.open(url, "riseup-presenter-inspector", "noopener,noreferrer");
}
