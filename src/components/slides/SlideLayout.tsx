import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /**
   * @deprecated Background is now resolved centrally in `ThemeWrap`
   * (deck settings + per-slide override + theme). Kept for call-site
   * compatibility; no longer painted here.
   */
  background?: string;
  className?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
};

/**
 * The 1920x1080 slide surface. Wrap inside <ScaledSlide>.
 * Background painting is owned by ThemeWrap (see RenderSlide).
 */
export function SlideLayout({
  children,
  className,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: Props) {
  return (
    <div className={`slide-content ${className ?? ""}`}>
      {children}
      {topLeft ? <div className="absolute left-[60px] top-[44px]">{topLeft}</div> : null}
      {topRight ? <div className="absolute right-[60px] top-[44px]">{topRight}</div> : null}
      {bottomLeft ? <div className="absolute left-[60px] bottom-[44px]">{bottomLeft}</div> : null}
      {bottomRight ? <div className="absolute right-[60px] bottom-[44px]">{bottomRight}</div> : null}
    </div>
  );
}
