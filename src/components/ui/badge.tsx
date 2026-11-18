import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors border select-none",
  {
    variants: {
      variant: {
        default:
          "border-[#DCEAF5] bg-[#DCEAF5] text-[#00549c]",
        primary:
          "border-[#00549c] bg-[#00549c] text-white",
        secondary:
          "border-[#E2E8F0] bg-[#F5F8FC] text-[#64748B]",
        success:
          "border-[#16A36A]/20 bg-[#16A36A]/10 text-[#16A36A]",
        warning:
          "border-[#E9A23B]/30 bg-[#E9A23B]/10 text-[#B4690E]",
        danger:
          "border-[#DC3545]/20 bg-[#DC3545]/10 text-[#DC3545]",
        info:
          "border-[#DCEAF5] bg-[#DCEAF5] text-[#00549c]",
        neutral:
          "border-[#E2E8F0] bg-[#F5F8FC] text-[#64748B]",
        outline:
          "border-[#E2E8F0] bg-white text-[#172B4D]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  const dotColor =
    variant === "success"
      ? "bg-[#16A36A]"
      : variant === "warning"
      ? "bg-[#E9A23B]"
      : variant === "danger"
      ? "bg-[#DC3545]"
      : "bg-[#00549c]";

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
