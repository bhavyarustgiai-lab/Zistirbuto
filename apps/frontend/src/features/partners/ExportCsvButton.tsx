import { Download } from "lucide-react";
import { Button } from "@components/ui/button";
import { exportCsv } from "@shared/lib/exportCsv";

export function ExportCsvButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}) {
  return (
    <Button variant="outline" className="h-11 w-full px-3 text-sm sm:w-auto" onClick={() => exportCsv(filename, headers, rows)}>
      <Download className="mr-1 h-4 w-4" />
      Export CSV
    </Button>
  );
}
