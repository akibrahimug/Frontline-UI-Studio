import { getWorkspaceAction } from "@/app/actions/workspaces";
import { getWorkspaceMembersAction } from "@/app/actions/members";
import { Header } from "@/components/header";
import Link from "next/link";
import { WorkspaceMembersManager } from "./workspace-members-manager";

export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceAction(workspaceId);
  const members = await getWorkspaceMembersAction(workspaceId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {workspace.name}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Workspace Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage who has access to {workspace.name}
          </p>
        </div>

        <WorkspaceMembersManager
          workspaceId={workspaceId}
          workspaceOwnerId={workspace.ownerId}
          initialMembers={members}
        />
      </div>
    </div>
  );
}
