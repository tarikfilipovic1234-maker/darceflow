"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";

import {
  inviteMemberAction,
  type InviteMemberState,
} from "@/app/dashboard/members/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BELT_LABEL, BELT_ORDER } from "@/lib/belts";

const initialState: InviteMemberState = {};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Adding member…" : "Invite member"}
    </Button>
  );
}

export function InviteMemberForm({ canInviteAdmins }: { canInviteAdmins: boolean }) {
  const [state, formAction] = useActionState(inviteMemberAction, initialState);
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<"ADMIN" | "COACH" | "STUDENT">("STUDENT");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Roger Gracie"
          autoComplete="off"
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="roger@academy.com"
          autoComplete="off"
          aria-invalid={!!state.fieldErrors?.email}
        />
        {state.fieldErrors?.email ? (
          <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="STUDENT">Student</option>
            <option value="COACH" disabled={!canInviteAdmins ? false : false}>
              Coach
            </option>
            {canInviteAdmins ? <option value="ADMIN">Admin</option> : null}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="belt">Starting belt (optional)</Label>
          <select
            id="belt"
            name="belt"
            defaultValue=""
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Auto (white for students)</option>
            {BELT_ORDER.map((b) => (
              <option key={b} value={b}>
                {BELT_LABEL[b]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Temporary password</Label>
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10 font-mono"
            aria-invalid={!!state.fieldErrors?.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Copy this and share it with them out-of-band. They&apos;ll change it on first sign-in.
          </p>
        )}
      </div>

      {state.error ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
