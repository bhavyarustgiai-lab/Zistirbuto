import type { InputHTMLAttributes } from "react";
import { Input } from "@components/ui/input";

export type AppInputProps = InputHTMLAttributes<HTMLInputElement>;

export function AppInput(props: AppInputProps) {
  return <Input {...props} />;
}
