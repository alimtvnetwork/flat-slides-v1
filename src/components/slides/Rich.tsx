import type { ReactNode } from "react";

import type { Highlight, RichText } from "./types";

function isHighlight(x: string | Highlight): x is Highlight {
  return typeof x === "object" && x !== null && "text" in x;
}

/**
 * Renders RichText, converting Highlight chips into `.hl` or `.hl-pill` spans
 * and preserving `\n` line breaks in plain strings.
 */
export function Rich({ value }: { value: RichText }): ReactNode {
  return (
    <>
      {value.map((part, i) => {
        if (isHighlight(part)) {
          return (
            <span key={i} className={part.pill ? "hl-pill" : "hl"}>
              {part.text}
            </span>
          );
        }
        const lines = part.split("\n");
        return (
          <span key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {line}
                {j < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}
