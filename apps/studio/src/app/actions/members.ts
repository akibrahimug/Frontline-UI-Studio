"use server";

import { auth } from "@/../../auth";
import { db, assertWorkspaceMember, isWorkspaceOwner, logActivity } from "@refinery/core";
import { revalidatePath } from "next/cache";

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembersAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this workspace
  await assertWorkspaceMember(workspaceId, session.user.id);

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members;
}

/**
 * Add a member to a workspace by email
 */
export async function addWorkspaceMemberAction(
  workspaceId: string,
  email: string,
  role: "owner" | "editor" | "viewer" = "editor"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner of the workspace
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can add members");
  }

  // Find user by email
  const userToAdd = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!userToAdd) {
    throw new Error("USER_NOT_FOUND");
  }

  // Check if user is already a member
  const existingMember = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: userToAdd.id,
      },
    },
  });

  if (existingMember) {
    throw new Error("ALREADY_MEMBER");
  }

  // Add the member
  await db.workspaceMember.create({
    data: {
      workspaceId,
      userId: userToAdd.id,
      role,
    },
  });

  // Log activity
  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "member_added",
    entityType: "member",
    entityId: userToAdd.id,
    metadata: {
      memberName: userToAdd.name || userToAdd.email,
      role,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);

  return { success: true, userName: userToAdd.name || userToAdd.email };
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMemberAction(
  workspaceId: string,
  memberUserId: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner of the workspace
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can remove members");
  }

  // Get workspace to check if target is the owner
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Can't remove the workspace owner
  if (workspace.ownerId === memberUserId) {
    throw new Error("Cannot remove the workspace owner");
  }

  // Get member info before deleting
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Remove the member
  await db.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
  });

  // Log activity
  if (member) {
    await logActivity({
      workspaceId,
      userId: session.user.id,
      action: "member_removed",
      entityType: "member",
      entityId: memberUserId,
      metadata: {
        memberName: member.user.name || member.user.email,
        role: member.role,
      },
    });
  }

  revalidatePath(`/workspaces/${workspaceId}`);

  return { success: true };
}

/**
 * Update a member's role
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  memberUserId: string,
  newRole: "owner" | "editor" | "viewer"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner of the workspace
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can change member roles");
  }

  // Get workspace to check if target is the owner
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Can't change the workspace owner's role
  if (workspace.ownerId === memberUserId) {
    throw new Error("Cannot change the workspace owner's role");
  }

  // Get member info before updating
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const oldRole = member?.role;

  // Update the role
  await db.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: memberUserId,
      },
    },
    data: {
      role: newRole,
    },
  });

  // Log activity
  if (member) {
    await logActivity({
      workspaceId,
      userId: session.user.id,
      action: "member_role_changed",
      entityType: "member",
      entityId: memberUserId,
      metadata: {
        memberName: member.user.name || member.user.email,
        oldRole,
        newRole,
      },
    });
  }

  revalidatePath(`/workspaces/${workspaceId}`);

  return { success: true };
}
