"use client";

import { useState, useTransition } from "react";
import { Button } from "@refinery/ui";
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  updateMemberRoleAction,
} from "@/app/actions/members";
import {
  sendWorkspaceInvitationAction,
  getWorkspaceInvitationsAction,
  cancelWorkspaceInvitationAction,
} from "@/app/actions/invitations";
import { useSession } from "next-auth/react";

type Member = {
  id: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

type Invitation = {
  id: string;
  inviteeEmail: string;
  role: string;
  status: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  inviter: {
    name: string | null;
    email: string;
  };
};

export function WorkspaceMembersManager({
  workspaceId,
  workspaceOwnerId,
  initialMembers,
}: {
  workspaceId: string;
  workspaceOwnerId: string;
  initialMembers: Member[];
}) {
  const { data: session } = useSession();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [useInvitations, setUseInvitations] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [invitationUrl, setInvitationUrl] = useState("");

  const isOwner = session?.user?.id === workspaceOwnerId;

  // Load invitations when component mounts or showInvitations changes
  const loadInvitations = async () => {
    if (isOwner && showInvitations) {
      try {
        const invites = await getWorkspaceInvitationsAction(workspaceId);
        setInvitations(invites);
      } catch (err: any) {
        console.error("Failed to load invitations:", err);
      }
    }
  };

  // Load invitations when showing them
  if (isOwner && showInvitations && invitations.length === 0) {
    loadInvitations();
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setInvitationUrl("");

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    startTransition(async () => {
      try {
        if (useInvitations) {
          // Send invitation
          const result = await sendWorkspaceInvitationAction(workspaceId, email, role);
          const inviteUrl = `${window.location.origin}/invitations/${result.token}`;
          setInvitationUrl(inviteUrl);
          setSuccess(`Invitation sent to ${email}. Share the link below with them.`);
          setEmail("");
          if (showInvitations) {
            loadInvitations();
          }
        } else {
          // Direct add (requires existing user)
          const result = await addWorkspaceMemberAction(workspaceId, email, role);
          setSuccess(`Successfully added ${result.userName} to the workspace`);
          setEmail("");
          window.location.reload();
        }
      } catch (err: any) {
        if (err.message === "USER_NOT_FOUND") {
          if (useInvitations) {
            setError("No user found with that email. They need to create an account first.");
          } else {
            setError("No user found with that email address");
          }
        } else if (err.message === "ALREADY_MEMBER") {
          setError("This user is already a member of the workspace");
        } else if (err.message === "INVITATION_ALREADY_SENT") {
          setError("An invitation has already been sent to this email");
        } else {
          setError(err.message || "Failed to add member");
        }
      }
    });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }

    startTransition(async () => {
      try {
        await cancelWorkspaceInvitationAction(invitationId);
        setSuccess("Invitation cancelled");
        loadInvitations();
      } catch (err: any) {
        setError(err.message || "Failed to cancel invitation");
      }
    });
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    startTransition(async () => {
      try {
        await removeWorkspaceMemberAction(workspaceId, memberUserId);
        setMembers(members.filter((m) => m.user.id !== memberUserId));
        setSuccess("Member removed successfully");
      } catch (err: any) {
        setError(err.message || "Failed to remove member");
      }
    });
  };

  const handleChangeRole = async (memberUserId: string, newRole: string) => {
    startTransition(async () => {
      try {
        await updateMemberRoleAction(
          workspaceId,
          memberUserId,
          newRole as "owner" | "editor" | "viewer"
        );
        setMembers(
          members.map((m) =>
            m.user.id === memberUserId ? { ...m, role: newRole } : m
          )
        );
        setSuccess("Role updated successfully");
      } catch (err: any) {
        setError(err.message || "Failed to update role");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Add Member Form - Only visible to owners */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Invite New Member
          </h2>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isPending}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter the email of a registered user to invite them
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                disabled={isPending}
              >
                <option value="editor">Editor - Can edit components</option>
                <option value="viewer">Viewer - Can view components</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Adding..." : "Add Member"}
            </Button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Current Members ({members.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => {
            const isMemberOwner = member.user.id === workspaceOwnerId;
            const isCurrentUser = member.user.id === session?.user?.id;

            return (
              <div
                key={member.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.user.name || member.user.email}
                        {isCurrentUser && (
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role selector - only for owners, can't change owner role */}
                  {isOwner && !isMemberOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeRole(member.user.id, e.target.value)
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-gray-100"
                      disabled={isPending}
                    >
                      <option value="owner">Owner</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        member.role === "owner"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : member.role === "editor"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {member.role}
                    </span>
                  )}

                  {/* Remove button - only for owners, can't remove owner */}
                  {isOwner && !isMemberOwner && (
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
