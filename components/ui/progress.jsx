"use client";

import * as React from "react";
import { Progress as ProgressRoot, ProgressIndicator } from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({ value, fillColor = "bg-green-500", className, ...props }) {
  const clampedValue = Math.min(value, 100); // Prevents overflow past full width
  return (
    <ProgressRoot
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressIndicator
        className={cn("h-full w-full flex-1 transition-all", fillColor)}
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressRoot>
  );
}


export { Progress };
