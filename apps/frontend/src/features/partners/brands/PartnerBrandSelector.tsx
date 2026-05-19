import { Select, type SelectOption } from "@components/ui/select";
import { cn } from "@shared/lib/cn";

type PartnerBrandSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
};

export function PartnerBrandSelector({
  value,
  onValueChange,
  options,
  disabled,
  className,
}: PartnerBrandSelectorProps) {
  return (
    <div className={cn("w-full sm:min-w-[280px] lg:w-[320px]", className)}>
      <Select
        value={value}
        onValueChange={onValueChange}
        options={options}
        disabled={disabled}
        searchable
        searchPlaceholder="Search brands..."
        emptyMessage="No brands found."
      />
    </div>
  );
}
