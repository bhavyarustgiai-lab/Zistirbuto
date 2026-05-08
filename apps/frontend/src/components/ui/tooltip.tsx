import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@shared/lib/cn";

export function Tooltip({
  content,
  children,
  className,
  align = "center",
  side = "top",
}: React.PropsWithChildren<{
  content: string;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}>) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const gap = 8;

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return;

    const rect = trigger.getBoundingClientRect();
    const next: React.CSSProperties = {};

    if (side === "right" || side === "left") {
      next.top =
        align === "start"
          ? rect.top
          : align === "end"
            ? rect.bottom
            : rect.top + rect.height / 2;
      next.transform =
        align === "start"
          ? "translateY(0)"
          : align === "end"
            ? "translateY(-100%)"
            : "translateY(-50%)";
      if (side === "right") next.left = rect.right + gap;
      if (side === "left") next.right = window.innerWidth - rect.left + gap;
    } else {
      next.left =
        align === "start"
          ? rect.left
          : align === "end"
            ? rect.right
            : rect.left + rect.width / 2;
      next.transform =
        align === "start"
          ? "translateX(0)"
          : align === "end"
            ? "translateX(-100%)"
            : "translateX(-50%)";
      if (side === "top") next.top = rect.top - gap;
      if (side === "bottom") next.top = rect.bottom + gap;
      if (side === "top") next.transform = `${next.transform} translateY(-100%)`;
    }

    setPosition(next);
  }, [align, side]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const bubble =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            style={position}
            className="pointer-events-none fixed z-[9999] w-max max-w-[240px] rounded-md bg-slate-900 px-2.5 py-1.5 text-center text-xs leading-5 text-white shadow-xl whitespace-normal break-words"
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => {
        updatePosition();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        updatePosition();
        setOpen(true);
      }}
      onBlur={() => setOpen(false)}
    >
      {children}
      {bubble}
    </div>
  );
}
