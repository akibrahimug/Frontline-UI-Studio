"use server";

import { auth } from "@/../../auth";
import { db, getUserWorkspaces, assertWorkspaceMember } from "@refinery/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createWorkspaceAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  if (!name) {
    throw new Error("Workspace name is required");
  }

  // Create workspace and auto-add owner as member
  const workspace = await db.workspace.create({
    data: {
      name,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  revalidatePath("/workspaces");
  redirect(`/workspaces/${workspace.id}`);
}

export async function listWorkspacesForUserAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Return all workspaces where user is a member (not just owner)
  return getUserWorkspaces(session.user.id);
}

export async function getWorkspaceAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Check membership instead of ownership
  const member = await assertWorkspaceMember(workspaceId, session.user.id);

  return member.workspace;
}
