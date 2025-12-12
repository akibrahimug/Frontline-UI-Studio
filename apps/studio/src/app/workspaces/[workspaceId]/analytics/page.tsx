import { getWorkspaceAction } from "../../../actions/workspaces";
import { getWorkspaceAnalyticsAction } from "../../../actions/analytics";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceAction(workspaceId);
  const analytics = await getWorkspaceAnalyticsAction(workspaceId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to {workspace.name}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Component usage statistics and insights for {workspace.name}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            Total events tracked: {analytics.totalEvents}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Components */}
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Top Components
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Most viewed and actively used components
              </p>
            </div>
            <div className="p-6">
              {analytics.topComponents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.topComponents.map((component, index) => (
                    <div
                      key={component.componentId}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/components/${component.componentId}`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {component.componentName}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{component.viewCount} views</span>
                          <span>{component.docsViewCount} docs views</span>
                          <span>{component.refactorCount} refactors</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-600" suppressHydrationWarning>
                          Last activity: {new Date(component.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cold Components */}
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cold Components
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Components with low or no recent activity
              </p>
            </div>
            <div className="p-6">
              {analytics.coldComponents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  All components are actively used!
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.coldComponents.map((component) => (
                    <div
                      key={component.componentId}
                      className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/components/${component.componentId}`}
                          className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {component.componentName}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{component.viewCount} views</span>
                          <span>{component.docsViewCount} docs views</span>
                          <span>{component.refactorCount} refactors</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-600" suppressHydrationWarning>
                          Last activity: {new Date(component.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
