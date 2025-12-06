import { createWorkspaceAction } from "../../actions/workspaces";
import { Button } from "@refinery/ui";
import Link from "next/link";

export default function NewWorkspacePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Create New Workspace
          </h1>

          <form action={createWorkspaceAction} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Component Library"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Create Workspace
              </Button>
              <Link href="/workspaces">
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
