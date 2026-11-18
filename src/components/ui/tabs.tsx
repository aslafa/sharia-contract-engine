"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  variant?: "underline" | "pills";
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pills";
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "underline",
  className,
  children,
  ...props
}: TabsProps) {
  const [activeTab, setActiveTabState] = React.useState(value || defaultValue);

  const setActiveTab = React.useCallback(
    (val: string) => {
      setActiveTabState(val);
      onValueChange?.(val);
    },
    [onValueChange]
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTabState(value);
    }
  }, [value]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(TabsContext);
  const isPills = context?.variant === "pills";

  return (
    <div
      className={cn(
        "flex items-center",
        isPills
          ? "gap-1.5 p-1 bg-[#F5F8FC] border border-[#E2E8F0] rounded-lg"
          : "gap-6 border-b border-[#E2E8F0]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.activeTab === value;
  const isPills = context.variant === "pills";

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "text-xs font-semibold tracking-tight transition-all select-none",
        isPills
          ? cn(
              "px-3 py-1.5 rounded-md",
              isActive
                ? "bg-white text-[#00549c] shadow-sm font-bold"
                : "text-[#64748B] hover:text-[#172B4D]"
            )
          : cn(
              "pb-2.5 pt-1 -mb-px border-b-2",
              isActive
                ? "border-[#00549c] text-[#00549c] font-bold"
                : "border-transparent text-[#64748B] hover:text-[#172B4D] hover:border-[#CBD5E1]"
            ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div className={cn("pt-1 outline-none", className)} {...props}>
      {children}
    </div>
  );
}

