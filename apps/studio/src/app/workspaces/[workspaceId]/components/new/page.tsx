import { createComponentAction } from "../../../../actions/components";
import { getWorkspaceAction } from "../../../../actions/workspaces";
import { Button } from "@refinery/ui";
import Link from "next/link";

export default async function NewComponentPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceAction(workspaceId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create New Component
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            in {workspace.name}
          </p>

          <form action={createComponentAction} className="space-y-6">
            <input type="hidden" name="workspaceId" value={workspaceId} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Component Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Button"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A slug will be generated automatically
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Create Component
              </Button>
              <Link href={`/workspaces/${workspaceId}`}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
