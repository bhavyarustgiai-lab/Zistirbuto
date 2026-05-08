import * as React from "react";
import { cn } from "@shared/lib/cn";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100", className)}
      {...props}
    />
  );
}

export function AvatarImage({ className, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} className={cn("absolute inset-0 h-full w-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("absolute inset-0 flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-700", className)}
      {...props}
    />
  );
}
