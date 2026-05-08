import * as React from "react";
import { cn } from "@shared/lib/cn";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  className,
  children
}: React.PropsWithChildren<{ value: string; onValueChange: (value: string) => void; className?: string }>) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used inside <Tabs />");
  }
  return ctx;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const tabs = useTabs();
  const active = tabs.value === value;
  return (
    <button
      type="button"
      className={cn(
        "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
        className
      )}
      onClick={() => tabs.onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
