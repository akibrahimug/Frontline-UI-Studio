import { getWorkspaceAction } from "@/app/actions/workspaces";
import { getWorkspaceActivities, formatActivityMessage } from "@refinery/core";
import { Header } from "@/components/header";
import Link from "next/link";
import { auth } from "@/../../auth";

export default async function WorkspaceActivityPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();
  const { workspaceId } = await params;
  const workspace = await getWorkspaceAction(workspaceId);
  const activities = await getWorkspaceActivities(workspaceId, 100);

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
            Activity Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Recent activity in {workspace.name}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No activity yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Workspace activity will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => {
                const timeAgo = getTimeAgo(new Date(activity.createdAt));
                const isCurrentUser = activity.user.id === session?.user?.id;

                return (
                  <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(activity.user.name || activity.user.email)[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {formatActivityMessage(activity)}
                          {isCurrentUser && (
                            <span className="ml-2 text-gray-500 dark:text-gray-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {timeAgo}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(
                            activity.action
                          )}`}
                        >
                          {formatActionType(activity.action)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatActionType(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getActionBadgeColor(action: string): string {
  if (action.includes("created")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (action.includes("deleted") || action.includes("removed")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  if (action.includes("updated") || action.includes("changed")) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }
  if (action.includes("invitation") || action.includes("added")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}
