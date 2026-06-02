import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { SHORTCUTS, type ShortcutGroup } from "../shortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GROUPS: ShortcutGroup[] = ["Navigation", "Steps", "Surfaces", "Presenter", "Camera"];

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 max-h-[60vh] overflow-auto pr-2">
          {GROUPS.map((group) => {
            const items = SHORTCUTS.filter((s) => s.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <ul className="space-y-1.5">
                  {items.map((s) => (
                    <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{s.label}</span>
                      <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-2 text-[11px] font-medium text-foreground">
                        {s.display}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
