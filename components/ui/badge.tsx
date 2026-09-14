import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === "secondary" && "bg-slate-700 text-slate-300",
      variant === "outline" && "border border-slate-600 text-slate-400",
      variant === "default" && "bg-slate-800 text-slate-300",
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
