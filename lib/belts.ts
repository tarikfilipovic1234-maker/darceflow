import type { BeltRank } from "@/lib/generated/prisma/enums";

export const BELT_ORDER: BeltRank[] = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"];

export const BELT_LABEL: Record<BeltRank, string> = {
  WHITE: "White",
  BLUE: "Blue",
  PURPLE: "Purple",
  BROWN: "Brown",
  BLACK: "Black",
};

// Tailwind classes for the belt body + ring outline.
export const BELT_CLASS: Record<BeltRank, string> = {
  WHITE: "bg-zinc-100 ring-zinc-300",
  BLUE: "bg-blue-600 ring-blue-700",
  PURPLE: "bg-purple-600 ring-purple-700",
  BROWN: "bg-amber-800 ring-amber-900",
  BLACK: "bg-zinc-950 ring-zinc-800",
};

export const BELT_TEXT_ON: Record<BeltRank, string> = {
  WHITE: "text-zinc-900",
  BLUE: "text-blue-100",
  PURPLE: "text-purple-100",
  BROWN: "text-amber-50",
  BLACK: "text-zinc-100",
};

export function nextBelt(belt: BeltRank): BeltRank | null {
  const idx = BELT_ORDER.indexOf(belt);
  if (idx < 0 || idx === BELT_ORDER.length - 1) return null;
  return BELT_ORDER[idx + 1] ?? null;
}
