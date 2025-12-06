"use server";

import { auth } from "@/../../auth";
import { db } from "@refinery/core";
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

  const workspace = await db.workspace.create({
    data: {
      name,
      ownerId: session.user.id,
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

  return db.workspace.findMany({
    where: {
      ownerId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getWorkspaceAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const workspace = await db.workspace.findUnique({
    where: {
      id: workspaceId,
      ownerId: session.user.id,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}
