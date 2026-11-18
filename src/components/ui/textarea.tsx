import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-xs text-[#172B4D] placeholder:text-[#94A3B8] transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:bg-[#F5F8FC] disabled:opacity-60",
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
Textarea.displayName = "Textarea";

export { Textarea };

