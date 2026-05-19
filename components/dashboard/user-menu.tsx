"use client";

import { LogOut, UserRound } from "lucide-react";

import { signOutAction } from "@/components/dashboard/sign-out-action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initialsFor(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserMenu({
  name,
  email,
  image,
  role,
  gymName,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  role: string;
  gymName: string | null | undefined;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 px-1.5",
        )}
      >
        <Avatar className="h-6 w-6">
          {image ? <AvatarImage src={image} alt={name ?? "User"} /> : null}
          <AvatarFallback className="text-[10px]">
            {initialsFor(name, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm sm:inline">{name ?? email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-medium">{name ?? email}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{role}</span>
            {gymName ? <span>· {gymName}</span> : null}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserRound className="mr-2 h-4 w-4" />
          Profile (coming in Phase 4)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void signOutAction();
          }}
          variant="destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
