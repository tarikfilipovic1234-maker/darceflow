"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import {
  createClassAction,
  type CreateClassState,
} from "@/app/dashboard/classes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAYS_OF_WEEK } from "@/lib/format";

const initialState: CreateClassState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Adding…" : "Add class"}
    </Button>
  );
}

export function NewClassForm({
  coaches,
}: {
  coaches: { id: string; name: string | null; email: string | null }[];
}) {
  const [state, formAction] = useActionState(createClassAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Class name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Fundamentals Gi"
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Beginner-friendly. Focus on the basics."
          aria-invalid={!!state.fieldErrors?.description}
        />
        {state.fieldErrors?.description ? (
          <p className="text-sm text-destructive">{state.fieldErrors.description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dayOfWeek">Day of week</Label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            defaultValue="1"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {DAYS_OF_WEEK.map((label, idx) => (
              <option key={label} value={idx}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue="18:30"
            aria-invalid={!!state.fieldErrors?.startTime}
          />
          {state.fieldErrors?.startTime ? (
            <p className="text-sm text-destructive">{state.fieldErrors.startTime}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="durationMin">Duration (minutes)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={15}
            max={240}
            defaultValue={60}
            aria-invalid={!!state.fieldErrors?.durationMin}
          />
          {state.fieldErrors?.durationMin ? (
            <p className="text-sm text-destructive">{state.fieldErrors.durationMin}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={20}
            aria-invalid={!!state.fieldErrors?.capacity}
          />
          {state.fieldErrors?.capacity ? (
            <p className="text-sm text-destructive">{state.fieldErrors.capacity}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="coachId">Coach (optional)</Label>
        <select
          id="coachId"
          name="coachId"
          defaultValue=""
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Unassigned</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email}
            </option>
          ))}
        </select>
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
