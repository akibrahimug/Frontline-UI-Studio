"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@refinery/ui";
import { useRouter } from "next/navigation";
import {
  acceptWorkspaceInvitationAction,
  declineWorkspaceInvitationAction,
} from "@/app/actions/invitations";

export function InvitationHandler({
  token,
  inviteeEmail,
  workspaceName,
  isExpired,
  isAlreadyResponded,
}: {
  token: string;
  inviteeEmail: string;
  workspaceName: string;
  isExpired: boolean;
  isAlreadyResponded: boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canRespond = !isExpired && !isAlreadyResponded && status === "authenticated";
  const emailMismatch =
    status === "authenticated" &&
    session?.user?.email?.toLowerCase() !== inviteeEmail.toLowerCase();

  const handleAccept = () => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await acceptWorkspaceInvitationAction(token);
        setSuccess(`You have joined ${result.workspaceName}!`);
        setTimeout(() => {
          router.push(`/workspaces/${result.workspaceId}`);
        }, 2000);
      } catch (err: any) {
        if (err.message === "INVITATION_EMAIL_MISMATCH") {
          setError(
            `This invitation was sent to ${inviteeEmail}. Please sign in with that email address.`
          );
        } else if (err.message === "ALREADY_MEMBER") {
          setError("You are already a member of this workspace");
          setTimeout(() => {
            router.push("/workspaces");
          }, 2000);
        } else if (err.message === "INVITATION_EXPIRED") {
          setError("This invitation has expired");
        } else if (err.message === "INVITATION_ALREADY_RESPONDED") {
          setError("You have already responded to this invitation");
        } else {
          setError(err.message || "Failed to accept invitation");
        }
      }
    });
  };

  const handleDecline = () => {
    if (!confirm("Are you sure you want to decline this invitation?")) {
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await declineWorkspaceInvitationAction(token);
        setSuccess(`You have declined the invitation to ${result.workspaceName}`);
        setTimeout(() => {
          router.push("/workspaces");
        }, 2000);
      } catch (err: any) {
        if (err.message === "INVITATION_EMAIL_MISMATCH") {
          setError(
            `This invitation was sent to ${inviteeEmail}. Please sign in with that email address.`
          );
        } else {
          setError(err.message || "Failed to decline invitation");
        }
      }
    });
  };

  if (status === "loading") {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
          Please sign in to respond to this invitation
        </div>
        <Button
          variant="primary"
          onClick={() => router.push(`/auth/signin?callbackUrl=/invitations/${token}`)}
          className="w-full"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (emailMismatch) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
        <p className="mb-2">
          <strong>Email Mismatch</strong>
        </p>
        <p className="text-sm">
          This invitation was sent to <strong>{inviteeEmail}</strong> but you are
          signed in as <strong>{session?.user?.email}</strong>.
        </p>
        <p className="text-sm mt-2">
          Please sign out and sign in with the invited email address to accept this
          invitation.
        </p>
      </div>
    );
  }

  if (isExpired || isAlreadyResponded) {
    return (
      <Button variant="secondary" onClick={() => router.push("/workspaces")} className="w-full">
        Go to Workspaces
      </Button>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {canRespond && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={handleAccept}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? "Processing..." : "Accept Invitation"}
          </Button>
          <Button
            variant="danger"
            onClick={handleDecline}
            disabled={isPending}
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
