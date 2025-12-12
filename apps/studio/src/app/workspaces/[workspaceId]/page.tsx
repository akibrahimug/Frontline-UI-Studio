import { getWorkspaceAction } from "../../actions/workspaces";
import { listComponentsAction } from "../../actions/components";
import { Button } from "@refinery/ui";
import Link from "next/link";
import { ComponentRegistry } from "@/components/component-registry";
import { Header } from "@/components/header";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceAction(workspaceId);
  const components = await listComponentsAction(workspaceId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/workspaces"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Workspaces
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {workspace.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage components in this workspace
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/workspaces/${workspaceId}/activity`}>
              <Button variant="secondary">Activity</Button>
            </Link>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <Button variant="secondary">Members</Button>
            </Link>
            <Link href={`/workspaces/${workspaceId}/analytics`}>
              <Button variant="secondary">Analytics</Button>
            </Link>
            <Link href={`/workspaces/${workspaceId}/components/new`}>
              <Button>New Component</Button>
            </Link>
          </div>
        </div>

        <ComponentRegistry components={components} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
