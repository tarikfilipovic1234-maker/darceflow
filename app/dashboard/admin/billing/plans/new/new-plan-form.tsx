"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import {
  createPlanAction,
  type CreatePlanState,
} from "@/app/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERVAL_LABEL, INTERVALS } from "@/lib/validators/billing";
import { formatMoney } from "@/lib/money";

const initialState: CreatePlanState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating…" : "Create plan"}
    </Button>
  );
}

export function NewPlanForm() {
  const [state, formAction] = useActionState(createPlanAction, initialState);
  const [amountCents, setAmountCents] = useState(5000);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Plan name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Unlimited"
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
          placeholder="All classes, all week."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="amountCents">Amount (cents)</Label>
          <Input
            id="amountCents"
            name="amountCents"
            type="number"
            min={0}
            max={1_000_000}
            step={100}
            value={amountCents}
            onChange={(e) => setAmountCents(Number(e.target.value) || 0)}
            aria-invalid={!!state.fieldErrors?.amountCents}
          />
          <p className="text-xs text-muted-foreground">
            Preview: <span className="font-medium">{formatMoney(amountCents)}</span>
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="interval">Billing interval</Label>
          <select
            id="interval"
            name="interval"
            defaultValue="MONTH"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {INTERVALS.map((i) => (
              <option key={i} value={i}>
                {INTERVAL_LABEL[i]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="features">Features</Label>
        <textarea
          id="features"
          name="features"
          rows={5}
          placeholder={"Unlimited classes\nOpen mat access\nGi and no-gi"}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">One feature per line. Max 12.</p>
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
