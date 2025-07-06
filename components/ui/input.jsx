import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base input styles
        "flex h-10 w-full rounded-md border border-cyan-200 bg-white px-3 py-2 text-base text-cyan-800 placeholder:text-cyan-150 shadow-sm transition focus:outline-none",

        // Focus ring & border
        "focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1",

        // File upload styles
        "file:text-cyan-700 file:font-medium file:bg-transparent file:border-0 file:text-sm file:h-7 file:inline-flex",

        // Disabled styles
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Error states (handled via aria-invalid)
        "aria-invalid:border-red-500 aria-invalid:ring-red-300",

        className
      )}
      {...props}
    />
  );
}

export { Input };
