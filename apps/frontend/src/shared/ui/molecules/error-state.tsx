import { AlertCircle } from "lucide-react";
import { AppButton } from "@shared/ui/atoms/app-button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <div className="grid min-h-[180px] justify-items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-6 text-center">
      <AlertCircle className="h-5 w-5 text-rose-600" />
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-rose-900">{title}</p>
        <p className="text-sm text-rose-700">{message}</p>
      </div>
      {onRetry ? (
        <AppButton variant="outline" className="h-9 px-3 text-sm" onClick={onRetry}>
          Retry
        </AppButton>
      ) : null}
    </div>
  );
}
