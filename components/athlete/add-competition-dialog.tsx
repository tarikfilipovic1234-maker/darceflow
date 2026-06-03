"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import {
  addCompetitionAction,
  type AddCompetitionState,
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
import { PLACEMENTS, PLACEMENT_LABEL } from "@/lib/validators/competitions";
import { cn } from "@/lib/utils";

const initialState: AddCompetitionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving…" : "Save result"}
    </Button>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AddCompetitionDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addCompetitionAction, initialState);

  useEffect(() => {
    // Close the dialog once the server action reports success.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.ok) setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
      >
        <Plus className="h-4 w-4" />
        Add result
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a competition result</DialogTitle>
          <DialogDescription>
            Event, bracket, and final score. Wins / losses count matches inside that bracket.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />

          <div className="grid gap-2">
            <Label htmlFor="eventName">Event</Label>
            <Input
              id="eventName"
              name="eventName"
              placeholder="IBJJF European Open"
              aria-invalid={!!state.fieldErrors?.eventName}
            />
            {state.fieldErrors?.eventName ? (
              <p className="text-sm text-destructive">{state.fieldErrors.eventName}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="division">Division</Label>
              <Input
                id="division"
                name="division"
                placeholder="Purple · Adult"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weightClassKg">Weight class (kg)</Label>
              <Input
                id="weightClassKg"
                name="weightClassKg"
                type="number"
                min={20}
                max={250}
                placeholder="76"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="placement">Placement</Label>
              <select
                id="placement"
                name="placement"
                defaultValue="GOLD"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {PLACEMENT_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wins">Wins</Label>
              <Input id="wins" name="wins" type="number" min={0} max={40} defaultValue={0} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="losses">Losses</Label>
              <Input id="losses" name="losses" type="number" min={0} max={40} defaultValue={0} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="competedAt">Date</Label>
            <Input
              id="competedAt"
              name="competedAt"
              type="date"
              defaultValue={todayIso()}
              aria-invalid={!!state.fieldErrors?.competedAt}
            />
            {state.fieldErrors?.competedAt ? (
              <p className="text-sm text-destructive">{state.fieldErrors.competedAt}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              name="note"
              placeholder="Lost the final to a triangle"
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
