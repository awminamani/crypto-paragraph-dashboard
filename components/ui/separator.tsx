import * as React from "react";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("h-px bg-slate-800", className)} {...props} />
));
Separator.displayName = "Separator";

export { Separator };
