import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  background?: string; // CSS color or url()
  className?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
};

/**
 * The 1920x1080 slide surface. Wrap inside <ScaledSlide>.
 */
export function SlideLayout({
  children,
  background,
  className,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: Props) {
  const style: CSSProperties = background
    ? background.startsWith("url(") || background.includes("://")
      ? {
          backgroundImage: background.startsWith("url(") ? background : `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { background }
    : {};
  return (
    <div className={`slide-content ${className ?? ""}`} style={style}>
      {children}
      {topLeft ? <div className="absolute left-[60px] top-[44px]">{topLeft}</div> : null}
      {topRight ? <div className="absolute right-[60px] top-[44px]">{topRight}</div> : null}
      {bottomLeft ? <div className="absolute left-[60px] bottom-[44px]">{bottomLeft}</div> : null}
      {bottomRight ? <div className="absolute right-[60px] bottom-[44px]">{bottomRight}</div> : null}
    </div>
  );
}
