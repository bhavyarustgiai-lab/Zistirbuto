import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { X } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  push: (input: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback((input: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { ...input, id }]);
    window.setTimeout(() => remove(id), 3200);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 grid gap-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={
              item.tone === "success"
                ? "pointer-events-auto border-emerald-300 bg-emerald-50"
                : "pointer-events-auto border-rose-300 bg-rose-50"
            }
          >
            <CardContent className="flex min-w-[320px] items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className={item.tone === "success" ? "text-sm font-semibold text-emerald-950" : "text-sm font-semibold text-rose-950"}>{item.title}</p>
                {item.description ? (
                  <p className={item.tone === "success" ? "mt-1 text-sm text-emerald-800" : "mt-1 text-sm text-rose-800"}>{item.description}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                className={item.tone === "success" ? "h-8 px-2 text-emerald-950 hover:bg-emerald-100" : "h-8 px-2 text-rose-950 hover:bg-rose-100"}
                onClick={() => remove(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
