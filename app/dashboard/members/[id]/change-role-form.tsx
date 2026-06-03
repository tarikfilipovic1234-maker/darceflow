"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { updateRoleAction } from "@/app/dashboard/members/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/generated/prisma/enums";

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "COACH", label: "Coach" },
  { value: "STUDENT", label: "Student" },
];

export function ChangeRoleForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [pending, startTransition] = useTransition();

  function submit(role: Role) {
    if (role === currentRole) return;
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", role);
    startTransition(async () => {
      await updateRoleAction(fd);
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {ROLES.map((r) => {
        const isCurrent = r.value === currentRole;
        return (
          <Button
            key={r.value}
            type="button"
            variant={isCurrent ? "default" : "outline"}
            disabled={pending || isCurrent}
            onClick={() => submit(r.value)}
            className={cn(isCurrent && "pointer-events-none")}
          >
            {pending && !isCurrent ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            {r.label}
          </Button>
        );
      })}
    </div>
  );
}
