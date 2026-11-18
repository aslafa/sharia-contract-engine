import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00549c] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#00549c] text-white hover:bg-[#00427c] active:bg-[#003666] shadow-sm",
        primary:
          "bg-[#00549c] text-white hover:bg-[#00427c] active:bg-[#003666] shadow-sm",
        secondary:
          "bg-[#F5F8FC] text-[#00549c] hover:bg-[#DCEAF5] border border-[#DCEAF5]",
        outline:
          "border border-[#E2E8F0] bg-white text-[#172B4D] hover:bg-[#F5F8FC] hover:border-[#CBD5E1] shadow-sm",
        ghost:
          "text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#172B4D]",
        danger:
          "bg-[#DC3545] text-white hover:bg-[#c82333] shadow-sm",
        success:
          "bg-[#16A36A] text-white hover:bg-[#138958] shadow-sm",
        link:
          "text-[#00549c] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        sm: "h-8 rounded px-2.5 text-[11px]",
        lg: "h-10 rounded-md px-5 text-sm",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
