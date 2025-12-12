"use server";

import { auth } from "@/../../auth";
import { db, isWorkspaceOwner, logActivity } from "@refinery/core";
import { revalidatePath } from "next/cache";

/**
 * Make a workspace public and generate a slug
 */
export async function makeWorkspacePublicAction(
  workspaceId: string,
  slug?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can make workspaces public");
  }

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true, isPublic: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (workspace.isPublic) {
    throw new Error("Workspace is already public");
  }

  // Generate slug from workspace name if not provided
  const publicSlug =
    slug ||
    workspace.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 8);

  // Check if slug is already taken
  const existingWorkspace = await db.workspace.findUnique({
    where: { publicSlug },
  });

  if (existingWorkspace) {
    throw new Error("SLUG_TAKEN");
  }

  // Update workspace
  await db.workspace.update({
    where: { id: workspaceId },
    data: {
      isPublic: true,
      publicSlug,
    },
  });

  // Log activity
  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "workspace_made_public",
    entityType: "workspace",
    entityId: workspaceId,
    metadata: {
      publicSlug,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);

  return {
    success: true,
    publicSlug,
    publicUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/public/${publicSlug}`,
  };
}

/**
 * Make a workspace private
 */
export async function makeWorkspacePrivateAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can make workspaces private");
  }

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { isPublic: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  if (!workspace.isPublic) {
    throw new Error("Workspace is already private");
  }

  // Update workspace
  await db.workspace.update({
    where: { id: workspaceId },
    data: {
      isPublic: false,
      publicSlug: null,
    },
  });

  // Log activity
  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "workspace_made_private",
    entityType: "workspace",
    entityId: workspaceId,
  });

  revalidatePath(`/workspaces/${workspaceId}`);

  return { success: true };
}

/**
 * Get public workspace by slug
 */
export async function getPublicWorkspaceAction(slug: string) {
  const workspace = await db.workspace.findUnique({
    where: { publicSlug: slug },
    include: {
      components: {
        where: {
          status: {
            in: ["canonical", "draft"],
          },
        },
        include: {
          versions: {
            where: {
              isCanonical: true,
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!workspace || !workspace.isPublic) {
    throw new Error("PUBLIC_WORKSPACE_NOT_FOUND");
  }

  return workspace;
}
