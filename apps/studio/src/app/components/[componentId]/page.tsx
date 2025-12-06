import { getComponentAction } from "../../actions/components";
import Link from "next/link";
import { ComponentEditor } from "./component-editor";

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ componentId: string }>;
}) {
  const { componentId } = await params;
  const component = await getComponentAction(componentId);
  const latestVersion = component.versions[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/workspaces/${component.workspaceId}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {component.workspace.name}
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {component.name}
            </h1>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                component.status === "canonical"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : component.status === "deprecated"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {component.status}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Slug: {component.slug}</p>
        </div>

        <ComponentEditor component={component} latestVersion={latestVersion} />
      </div>
    </div>
  );
}
