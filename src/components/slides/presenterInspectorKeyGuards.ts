export function isTextEntryTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  const tag = element?.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(element?.isContentEditable)
  );
}

export function keyName(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (key.length === 1) return key;
  return event.code.toLowerCase().replace(/^key/, "") || key;
}

export function runInspectorAction(event: KeyboardEvent, action: () => void) {
  event.preventDefault();
  action();
  return true;
}
