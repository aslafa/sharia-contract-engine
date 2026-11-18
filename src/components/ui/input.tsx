import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-white px-3 py-1.5 text-xs text-[#172B4D] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:bg-[#F5F8FC] disabled:opacity-60",
          error
            ? "border-[#DC3545] focus-visible:border-[#DC3545] focus-visible:ring-[#DC3545]"
            : "border-[#E2E8F0] focus-visible:border-[#00549c] focus-visible:ring-[#00549c]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
