import type { PropsWithChildren } from "react";
import { Sidebar } from "@shared/ui/organisms/Sidebar";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen grid-cols-[360px_1fr] bg-[#f4f5f8]">
      <Sidebar />
      <main className="p-5">{children}</main>
    </div>
  );
}
