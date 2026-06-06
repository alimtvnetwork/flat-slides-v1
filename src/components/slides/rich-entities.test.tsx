import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Rich } from "./Rich";
import { decodeEntities } from "./decodeEntities";

describe("decodeEntities (issue 027)", () => {
  it("decodes named entities", () => {
    expect(decodeEntities("R&amp;D &mdash; 2026")).toBe("R&D \u2014 2026");
  });
  it("decodes numeric + hex entities", () => {
    expect(decodeEntities("&#38;&#x2014;")).toBe("&\u2014");
  });
  it("leaves unknown entities intact", () => {
    expect(decodeEntities("&fakeent;")).toBe("&fakeent;");
  });
  it("Rich renders &amp; as a literal ampersand, not the source text", () => {
    const { container } = render(<Rich value={["R&amp;D &mdash; ship"]} />);
    expect(container.textContent).toBe("R&D \u2014 ship");
    expect(container.textContent).not.toContain("&amp;");
  });
  it("Rich decodes entities inside Highlight chips", () => {
    const { container } = render(
      <Rich value={[{ text: "AT&amp;T", pill: true }]} />,
    );
    expect(container.textContent).toBe("AT&T");
  });
});
