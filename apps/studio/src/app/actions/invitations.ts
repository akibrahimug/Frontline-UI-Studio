"use server";

import { auth } from "@/../../auth";
import { db, isWorkspaceOwner, logActivity } from "@refinery/core";
import { revalidatePath } from "next/cache";

/**
 * Send a workspace invitation via email
 */
export async function sendWorkspaceInvitationAction(
  workspaceId: string,
  email: string,
  role: "editor" | "viewer" = "editor"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner of the workspace
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can send invitations");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user is already a member
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const existingMember = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      throw new Error("ALREADY_MEMBER");
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await db.workspaceInvitation.findFirst({
    where: {
      workspaceId,
      inviteeEmail: normalizedEmail,
      status: "pending",
    },
  });

  if (existingInvitation) {
    throw new Error("INVITATION_ALREADY_SENT");
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await db.workspaceInvitation.create({
    data: {
      workspaceId,
      inviterId: session.user.id,
      inviteeEmail: normalizedEmail,
      role,
      expiresAt,
    },
    include: {
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  // Log activity
  await logActivity({
    workspaceId,
    userId: session.user.id,
    action: "invitation_sent",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: {
      inviteeEmail: normalizedEmail,
      role,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/members`);

  return {
    success: true,
    invitationId: invitation.id,
    token: invitation.token,
    workspaceName: invitation.workspace.name,
  };
}

/**
 * Accept a workspace invitation
 */
export async function acceptWorkspaceInvitationAction(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const invitation = await db.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (invitation.status !== "pending") {
    throw new Error("INVITATION_ALREADY_RESPONDED");
  }

  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await db.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "expired",
        respondedAt: new Date(),
      },
    });
    throw new Error("INVITATION_EXPIRED");
  }

  // Verify the email matches
  if (invitation.inviteeEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    throw new Error("INVITATION_EMAIL_MISMATCH");
  }

  // Check if already a member
  const existingMember = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (existingMember) {
    // Update invitation as accepted
    await db.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        respondedAt: new Date(),
      },
    });
    throw new Error("ALREADY_MEMBER");
  }

  // Add user as member and update invitation
  await db.$transaction([
    db.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    db.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        respondedAt: new Date(),
      },
    }),
  ]);

  // Log activity
  await logActivity({
    workspaceId: invitation.workspaceId,
    userId: session.user.id,
    action: "invitation_accepted",
    entityType: "invitation",
    entityId: invitation.id,
    metadata: {
      role: invitation.role,
    },
  });

  revalidatePath("/workspaces");
  revalidatePath(`/workspaces/${invitation.workspaceId}`);

  return {
    success: true,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
  };
}

/**
 * Decline a workspace invitation
 */
export async function declineWorkspaceInvitationAction(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const invitation = await db.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("INVITATION_NOT_FOUND");
  }

  if (invitation.status !== "pending") {
    throw new Error("INVITATION_ALREADY_RESPONDED");
  }

  // Verify the email matches
  if (invitation.inviteeEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    throw new Error("INVITATION_EMAIL_MISMATCH");
  }

  // Update invitation
  await db.workspaceInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "declined",
      respondedAt: new Date(),
    },
  });

  // Log activity
  await logActivity({
    workspaceId: invitation.workspaceId,
    userId: session.user.id,
    action: "invitation_declined",
    entityType: "invitation",
    entityId: invitation.id,
  });

  return {
    success: true,
    workspaceName: invitation.workspace.name,
  };
}

/**
 * Get pending invitations for the current user
 */
export async function getUserPendingInvitationsAction() {
  const session = await auth();
  if (!session?.user?.email) {
    return [];
  }

  const invitations = await db.workspaceInvitation.findMany({
    where: {
      inviteeEmail: session.user.email.toLowerCase(),
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations;
}

/**
 * Get all invitations for a workspace (owner only)
 */
export async function getWorkspaceInvitationsAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user is the owner
  const isOwner = await isWorkspaceOwner(workspaceId, session.user.id);
  if (!isOwner) {
    throw new Error("Only workspace owners can view invitations");
  }

  const invitations = await db.workspaceInvitation.findMany({
    where: { workspaceId },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations;
}

/**
 * Cancel/revoke a pending invitation (owner only)
 */
export async function cancelWorkspaceInvitationAction(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const invitation = await db.workspaceInvitation.findUnique({
    where: { id: invitationId },
    include: {
      workspace: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Verify user is the workspace owner
  if (invitation.workspace.ownerId !== session.user.id) {
    throw new Error("Only workspace owners can cancel invitations");
  }

  if (invitation.status !== "pending") {
    throw new Error("Can only cancel pending invitations");
  }

  // Delete the invitation
  await db.workspaceInvitation.delete({
    where: { id: invitationId },
  });

  revalidatePath(`/workspaces/${invitation.workspaceId}/members`);

  return { success: true };
}
