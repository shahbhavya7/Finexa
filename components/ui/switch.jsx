"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base track styles
        "peer inline-flex h-[1.15rem] w-9 shrink-0 items-center rounded-full border border-transparent transition-all shadow-xs outline-none",

        // Themed: cyan when checked, gray when not
        "data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-gray-300",

        // Focus ring and disabled state
        "focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",

        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Thumb base
          "pointer-events-none block size-4 rounded-full transition-transform shadow-sm",

          // Movement
          "data-[state=checked]:translate-x-[1.125rem]", 

          // Thumb color: white on cyan, muted on gray
          "data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-100"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

