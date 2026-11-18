import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subValue,
  trend,
  icon: Icon,
  badge,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("hover:border-[#CBD5E1] transition-colors", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            {badge}
            {Icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F5F8FC] border border-[#E2E8F0] text-[#00549c]">
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#172B4D] font-sans">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-[#64748B] font-medium">
              {subValue}
            </span>
          )}
        </div>

        {trend && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-bold text-[11px] px-1.5 py-0.5 rounded",
                trend.direction === "up"
                  ? "bg-[#16A36A]/10 text-[#16A36A]"
                  : trend.direction === "down"
                  ? "bg-[#DC3545]/10 text-[#DC3545]"
                  : "bg-[#F1F5F9] text-[#64748B]"
              )}
            >
              {trend.direction === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trend.direction === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
              <span>{trend.value}</span>
            </span>
            {trend.label && (
              <span className="text-[11px] text-[#64748B]">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

