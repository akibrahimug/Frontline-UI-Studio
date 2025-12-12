/**
 * Access Control Helpers
 * Centralized functions for checking workspace and component access
 */

import { db } from "./db";

/**
 * Check if a user is a member of a workspace
 * @returns WorkspaceMember if user has access, null otherwise
 */
export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string
) {
  return db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
    },
  });
}

/**
 * Assert that a user is a member of a workspace
 * @throws Error if user is not a member
 */
export async function assertWorkspaceMember(
  workspaceId: string,
  userId: string
) {
  const member = await getWorkspaceMembership(workspaceId, userId);

  if (!member) {
    // Check if workspace exists to provide better error message
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new Error("WORKSPACE_NOT_FOUND");
    }

    throw new Error("WORKSPACE_ACCESS_DENIED");
  }

  return member;
}

/**
 * Check if a user has access to a component (via workspace membership)
 * @returns Component with workspace if user has access
 * @throws Error if user doesn't have access
 */
export async function assertComponentAccess(
  componentId: string,
  userId: string
) {
  const component = await db.component.findUnique({
    where: { id: componentId },
    include: { workspace: true },
  });

  if (!component) {
    throw new Error("COMPONENT_NOT_FOUND");
  }

  // Check if user is a member of the component's workspace
  const member = await getWorkspaceMembership(component.workspaceId, userId);

  if (!member) {
    throw new Error("COMPONENT_ACCESS_DENIED");
  }

  return { component, member };
}

/**
 * Check if a user is the owner of a workspace
 */
export async function isWorkspaceOwner(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  return workspace?.ownerId === userId;
}

/**
 * Get all workspaces a user has access to
 */
export async function getUserWorkspaces(userId: string) {
  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      workspace: {
        updatedAt: "desc",
      },
    },
  });

  return memberships.map((m) => m.workspace);
}
