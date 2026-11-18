import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-[#64748B]">
      <Link
        href="/dashboard"
        className="flex items-center text-[#64748B] hover:text-[#00549c] transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-1.5">
            <ChevronRight className="h-3 w-3 text-[#CBD5E1]" />
            {isLast || !item.href ? (
              <span className="font-semibold text-[#172B4D]">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-[#00549c] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

