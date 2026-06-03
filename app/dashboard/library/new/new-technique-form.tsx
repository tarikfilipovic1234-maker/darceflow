"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import {
  createTechniqueAction,
  type CreateTechniqueState,
} from "@/app/dashboard/library/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  POSITIONS,
  POSITION_LABEL,
} from "@/lib/validators/techniques";

const initialState: CreateTechniqueState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? "Saving…" : "Save technique"}
    </Button>
  );
}

export function NewTechniqueForm() {
  const [state, formAction] = useActionState(createTechniqueAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Triangle from closed guard"
          aria-invalid={!!state.fieldErrors?.title}
        />
        {state.fieldErrors?.title ? (
          <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          type="url"
          placeholder="https://youtu.be/… or https://vimeo.com/… or .mp4 link"
          aria-invalid={!!state.fieldErrors?.videoUrl}
        />
        {state.fieldErrors?.videoUrl ? (
          <p className="text-sm text-destructive">{state.fieldErrors.videoUrl}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            YouTube and Vimeo links auto-embed. Thumbnails come from YouTube automatically.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="position">Position</Label>
          <select
            id="position"
            name="position"
            defaultValue="CLOSED_GUARD"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {POSITION_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue="SUBMISSION"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="triangle, fundamentals, gi"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated. Up to 12.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="durationSec">Duration (seconds)</Label>
          <Input
            id="durationSec"
            name="durationSec"
            type="number"
            min={1}
            placeholder="180"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
          <Input
            id="thumbnailUrl"
            name="thumbnailUrl"
            type="url"
            placeholder="Auto for YouTube"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description / notes</Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Setup, grip details, common mistakes…"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
