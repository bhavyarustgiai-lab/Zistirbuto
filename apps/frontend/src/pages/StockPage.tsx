import { Boxes, Clock3 } from "lucide-react";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

export function StockPage() {
  return (
    <section className="mx-auto max-w-4xl py-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-6">
          <div>
            <CardTitle className="text-3xl tracking-tight text-slate-950">Stock</CardTitle>
            <p className="mt-2 text-sm text-slate-500">
              Inventory workflows are planned next. This page is reserved for stock intake, usage, and low inventory alerts.
            </p>
          </div>
          <Badge tone="neutral">Coming Soon</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-xl bg-white p-2 text-slate-700">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Stock ledger</p>
                <p className="mt-1 text-sm text-slate-500">Track products, units, adjustments, and consumption by service.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-xl bg-white p-2 text-slate-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Reorder planning</p>
                <p className="mt-1 text-sm text-slate-500">Low stock alerts, vendor purchase planning, and reorder thresholds will land here.</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
