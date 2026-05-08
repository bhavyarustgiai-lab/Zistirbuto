import type { ButtonHTMLAttributes } from "react";
import { Button } from "@components/ui/button";

export type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
};

export function AppButton(props: AppButtonProps) {
  return <Button {...props} />;
}
