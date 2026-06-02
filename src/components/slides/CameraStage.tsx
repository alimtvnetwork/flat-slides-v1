import { type ReactNode } from "react";

import { type Slide } from "./types";

interface Props {
  slide: Slide;
  step: number;
  children: ReactNode;
}

/**
 * CameraStage is intentionally an identity wrapper while zoom effects are disabled.
 */
export function CameraStage({ children }: Props) {
  return <div className="absolute inset-0">{children}</div>;
}
