"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import {
  addInjuryAction,
  type AddInjuryState,
} from "@/app/dashboard/members/[id]/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BODY_PARTS,
  BODY_PART_LABEL,
  SEVERITIES,
  SEVERITY_LABEL,
} from "@/lib/validators/injuries";
import { cn } from "@/lib/utils";

const initialState: AddInjuryState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving…" : "Log injury"}
    </Button>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AddInjuryDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addInjuryAction, initialState);

  useEffect(() => {
    // Close the dialog once the server action reports success.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
        <Plus className="h-4 w-4" />
        Log injury
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log an injury</DialogTitle>
          <DialogDescription>
            Coaches will see this on the roster so they can plan around it in sparring.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />

          <div className="grid gap-2">
            <Label htmlFor="bodyPart">Body part</Label>
            <select
              id="bodyPart"
              name="bodyPart"
              defaultValue="KNEE"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {BODY_PARTS.map((b) => (
                <option key={b} value={b}>
                  {BODY_PART_LABEL[b]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                name="severity"
                defaultValue="MINOR"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startedAt">Started</Label>
              <Input
                id="startedAt"
                name="startedAt"
                type="date"
                defaultValue={todayIso()}
                aria-invalid={!!state.fieldErrors?.startedAt}
              />
              {state.fieldErrors?.startedAt ? (
                <p className="text-sm text-destructive">{state.fieldErrors.startedAt}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              name="note"
              placeholder="Tweaked it during a Berimbolo attempt"
            />
          </div>

          {state.error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
