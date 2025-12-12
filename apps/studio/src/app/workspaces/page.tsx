import { listWorkspacesForUserAction } from "../actions/workspaces";
import { Button } from "@refinery/ui";
import Link from "next/link";

export default async function WorkspacesPage() {
  const workspaces = await listWorkspacesForUserAction();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workspaces</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your component refinement workspaces
            </p>
          </div>
          <Link href="/workspaces/new">
            <Button>Create Workspace</Button>
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first workspace
            </p>
            <Link href="/workspaces/new">
              <Button>Create Your First Workspace</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="block p-6 bg-white dark:bg-gray-950 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {workspace.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
