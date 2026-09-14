"use client";

import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const skeletonVariants = cva("animate-pulse rounded-md bg-slate-800", {
  variants: {
    variant: {
      default: "bg-slate-800",
      card: "bg-slate-800/60 border border-slate-700 rounded-2xl",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />;
}

export { Skeleton };
