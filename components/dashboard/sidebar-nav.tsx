"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  ScanLine,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Role } from "@/lib/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

const items: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["ADMIN", "COACH", "STUDENT"],
  },
  {
    href: "/dashboard/members",
    label: "Members",
    icon: Users,
    roles: ["ADMIN", "COACH"],
  },
  {
    href: "/dashboard/schedule",
    label: "Schedule",
    icon: CalendarCheck,
    roles: ["ADMIN", "COACH", "STUDENT"],
  },
  {
    href: "/dashboard/classes",
    label: "Class templates",
    icon: CalendarClock,
    roles: ["ADMIN", "COACH"],
  },
  {
    href: "/dashboard/check-in",
    label: "Check-in",
    icon: ScanLine,
    roles: ["ADMIN", "COACH"],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["ADMIN", "COACH"],
  },
  {
    href: "/dashboard/library",
    label: "Technique library",
    icon: LibraryBig,
    roles: ["ADMIN", "COACH", "STUDENT"],
  },
  {
    href: "/dashboard/admin/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ["ADMIN"],
  },
];

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <nav className="flex flex-col gap-0.5">
      {visible.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
