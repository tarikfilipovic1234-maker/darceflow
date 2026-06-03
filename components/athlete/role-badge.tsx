import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  COACH: "Coach",
  STUDENT: "Student",
};

const ROLE_CLASS: Record<Role, string> = {
  ADMIN: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  COACH: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  STUDENT: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
};

export function RoleBadge({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", ROLE_CLASS[role], className)}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}
