import { getWorkspaceAction } from "../../actions/workspaces";
import { listComponentsAction } from "../../actions/components";
import { Button } from "@refinery/ui";
import Link from "next/link";

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
          <Link href={`/workspaces/${workspaceId}/components/new`}>
            <Button>New Component</Button>
          </Link>
        </div>

        {components.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No components yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first component to get started
            </p>
            <Link href={`/workspaces/${workspaceId}/components/new`}>
              <Button>Create Component</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {components.map((component) => (
                  <tr
                    key={component.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/components/${component.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {component.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {component.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          component.status === "canonical"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : component.status === "deprecated"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {component.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(component.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
