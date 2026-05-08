import type { ReactNode } from "react";
import { Drawer } from "@components/ui/drawer";

type ResourceFormDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ResourceFormDialog({ open, title, onClose, children, className, bodyClassName }: ResourceFormDialogProps) {
  return (
    <Drawer open={open} title={title} onClose={onClose} className={className} bodyClassName={bodyClassName}>
      {children}
    </Drawer>
  );
}
