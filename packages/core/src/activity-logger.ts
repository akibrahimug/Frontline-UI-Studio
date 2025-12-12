/**
 * Activity Logger
 * Centralized activity tracking for workspace actions
 */

import { db } from "./db";

export type ActivityAction =
  // Member actions
  | "member_added"
  | "member_removed"
  | "member_role_changed"
  // Component actions
  | "component_created"
  | "component_updated"
  | "component_deleted"
  | "component_status_changed"
  | "version_created"
  | "version_set_canonical"
  // Invitation actions
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_declined"
  | "invitation_expired"
  // Workspace actions
  | "workspace_created"
  | "workspace_updated"
  | "workspace_deleted"
  | "workspace_made_public"
  | "workspace_made_private";

export type EntityType = "workspace" | "component" | "member" | "invitation";

interface LogActivityParams {
  workspaceId: string;
  userId: string;
  action: ActivityAction;
  entityType?: EntityType;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to the activity log
 */
export async function logActivity({
  workspaceId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: LogActivityParams) {
  try {
    await db.activityLog.create({
      data: {
        workspaceId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
      },
    });
  } catch (error) {
    // Log but don't throw - activity logging shouldn't break the main flow
    console.error("Failed to log activity:", error);
  }
}

/**
 * Get recent activities for a workspace
 */
export async function getWorkspaceActivities(
  workspaceId: string,
  limit: number = 50
) {
  return db.activityLog.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get activities for a specific user
 */
export async function getUserActivities(userId: string, limit: number = 50) {
  return db.activityLog.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Get activities by action type
 */
export async function getActivitiesByAction(
  workspaceId: string,
  action: ActivityAction,
  limit: number = 50
) {
  return db.activityLog.findMany({
    where: {
      workspaceId,
      action,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * Format activity for display
 */
export function formatActivityMessage(activity: {
  action: string;
  user: { name: string | null; email: string };
  metadata?: any;
}): string {
  const userName = activity.user.name || activity.user.email;

  switch (activity.action) {
    case "member_added":
      return `${userName} added ${activity.metadata?.memberName || "a member"} to the workspace`;
    case "member_removed":
      return `${userName} removed ${activity.metadata?.memberName || "a member"} from the workspace`;
    case "member_role_changed":
      return `${userName} changed ${activity.metadata?.memberName || "a member"}'s role to ${activity.metadata?.newRole}`;
    case "component_created":
      return `${userName} created component "${activity.metadata?.componentName}"`;
    case "component_updated":
      return `${userName} updated component "${activity.metadata?.componentName}"`;
    case "component_deleted":
      return `${userName} deleted component "${activity.metadata?.componentName}"`;
    case "component_status_changed":
      return `${userName} changed component "${activity.metadata?.componentName}" status to ${activity.metadata?.newStatus}`;
    case "version_created":
      return `${userName} created version ${activity.metadata?.version} for "${activity.metadata?.componentName}"`;
    case "version_set_canonical":
      return `${userName} set version ${activity.metadata?.version} as canonical for "${activity.metadata?.componentName}"`;
    case "invitation_sent":
      return `${userName} invited ${activity.metadata?.inviteeEmail} to the workspace`;
    case "invitation_accepted":
      return `${userName} accepted workspace invitation`;
    case "invitation_declined":
      return `${userName} declined workspace invitation`;
    case "workspace_created":
      return `${userName} created the workspace`;
    case "workspace_updated":
      return `${userName} updated workspace settings`;
    case "workspace_made_public":
      return `${userName} made the workspace public`;
    case "workspace_made_private":
      return `${userName} made the workspace private`;
    default:
      return `${userName} performed action: ${activity.action}`;
  }
}
