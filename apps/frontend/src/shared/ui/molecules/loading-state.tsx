import { Spinner } from "@shared/ui/atoms/Spinner";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-[180px] items-center justify-center gap-3 text-sm text-slate-500" role="status">
      <Spinner className="h-5 w-5" />
      <span>{label}</span>
    </div>
  );
}
