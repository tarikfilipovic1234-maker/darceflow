"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireGymId, requireRole, requireSession } from "@/lib/db/scoped";
import { randomSuffix, slugify } from "@/lib/slug";
import { createTechniqueSchema } from "@/lib/validators/techniques";
import { autoThumbnail } from "@/lib/video";

export type CreateTechniqueState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase())
        .slice(0, 12),
    ),
  );
}

export async function createTechniqueAction(
  _prev: CreateTechniqueState | undefined,
  formData: FormData,
): Promise<CreateTechniqueState> {
  const session = await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();

  const parsed = createTechniqueSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    videoUrl: String(formData.get("videoUrl") ?? "").trim(),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim(),
    position: String(formData.get("position") ?? "OTHER"),
    category: String(formData.get("category") ?? "SUBMISSION"),
    tags: String(formData.get("tags") ?? ""),
    durationSec: String(formData.get("durationSec") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const tags = parsed.data.tags ? parseTags(parsed.data.tags) : [];

  // Slug from title, unique per gym.
  const base = slugify(parsed.data.title) || "technique";
  let slug = base;
  let attempts = 0;
  while (await prisma.technique.findUnique({ where: { gymId_slug: { gymId, slug } } })) {
    attempts += 1;
    slug = `${base}-${randomSuffix()}`;
    if (attempts > 8) return { error: "Could not assign a unique slug. Try another title." };
  }

  const thumbnailUrl =
    parsed.data.thumbnailUrl ||
    autoThumbnail(parsed.data.videoUrl) ||
    null;

  await prisma.technique.create({
    data: {
      gymId,
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      videoUrl: parsed.data.videoUrl,
      thumbnailUrl,
      position: parsed.data.position,
      category: parsed.data.category,
      tags,
      durationSec:
        typeof parsed.data.durationSec === "number" ? parsed.data.durationSec : null,
      uploadedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard");
  redirect(`/dashboard/library/${slug}`);
}

export async function deleteTechniqueAction(formData: FormData) {
  await requireRole(["ADMIN", "COACH"]);
  const { gymId } = await requireGymId();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.technique.deleteMany({ where: { id, gymId } });
  revalidatePath("/dashboard/library");
  redirect("/dashboard/library");
}

export async function toggleFavoriteAction(formData: FormData) {
  const session = await requireSession();
  const { gymId } = await requireGymId();
  const techniqueId = String(formData.get("techniqueId") ?? "");
  if (!techniqueId) return;

  // Tenant guard.
  const technique = await prisma.technique.findFirst({
    where: { id: techniqueId, gymId },
    select: { id: true, slug: true },
  });
  if (!technique) return;

  const existing = await prisma.techniqueFavorite.findUnique({
    where: { userId_techniqueId: { userId: session.user.id, techniqueId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.techniqueFavorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.techniqueFavorite.create({
      data: { userId: session.user.id, techniqueId },
    });
  }

  revalidatePath("/dashboard/library");
  revalidatePath(`/dashboard/library/${technique.slug}`);
}
