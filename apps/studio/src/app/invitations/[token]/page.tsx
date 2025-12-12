import { Header } from "@/components/header";
import { InvitationHandler } from "./invitation-handler";
import { db } from "@refinery/core";
import Link from "next/link";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Fetch invitation details
  const invitation = await db.workspaceInvitation.findUnique({
    where: { token },
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
  });

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Invitation Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              This invitation link is invalid or has been removed.
            </p>
            <Link
              href="/workspaces"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Workspaces
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > invitation.expiresAt;
  const isAlreadyResponded = invitation.status !== "pending";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Workspace Invitation
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Workspace
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {invitation.workspace.name}
              </p>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Invited by
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {invitation.inviter.name || invitation.inviter.email}
              </p>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Role
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {invitation.role}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Expires
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
              This invitation has expired
            </div>
          )}

          {isAlreadyResponded && !isExpired && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-6">
              You have already responded to this invitation (Status: {invitation.status})
            </div>
          )}

          <InvitationHandler
            token={token}
            inviteeEmail={invitation.inviteeEmail}
            workspaceName={invitation.workspace.name}
            isExpired={isExpired}
            isAlreadyResponded={isAlreadyResponded}
          />
        </div>
      </div>
    </div>
  );
}
