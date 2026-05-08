import type { LucideIcon } from "lucide-react";

export function Icon({ icon: Component, className = "h-4 w-4" }: { icon: LucideIcon; className?: string }) {
  return <Component className={className} />;
}
