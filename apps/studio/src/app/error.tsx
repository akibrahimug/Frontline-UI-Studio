"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@refinery/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error("Application error:", error);
  }, [error]);

  // Parse error message to provide better user feedback
  const getErrorMessage = () => {
    const message = error.message;

    if (message === "WORKSPACE_NOT_FOUND") {
      return {
        title: "Workspace Not Found",
        description:
          "The workspace you're looking for doesn't exist or has been deleted.",
        action: "Go to Workspaces",
        actionHref: "/workspaces",
      };
    }

    if (message === "WORKSPACE_ACCESS_DENIED") {
      return {
        title: "Access Denied",
        description:
          "You don't have permission to access this workspace. Please contact the workspace owner to request access.",
        action: "Go to Workspaces",
        actionHref: "/workspaces",
      };
    }

    if (message === "COMPONENT_NOT_FOUND") {
      return {
        title: "Component Not Found",
        description:
          "The component you're looking for doesn't exist or has been deleted.",
        action: "Go to Workspaces",
        actionHref: "/workspaces",
      };
    }

    if (message === "COMPONENT_ACCESS_DENIED") {
      return {
        title: "Access Denied",
        description:
          "You don't have permission to access this component. Please contact the workspace owner to request access.",
        action: "Go to Workspaces",
        actionHref: "/workspaces",
      };
    }

    if (message.includes("Unauthorized")) {
      return {
        title: "Authentication Required",
        description: "Please sign in to continue.",
        action: "Sign In",
        actionHref: "/auth/signin",
      };
    }

    // Generic error message
    return {
      title: "Something Went Wrong",
      description:
        "An unexpected error occurred. Please try again or contact support if the problem persists.",
      action: "Try Again",
      actionHref: null,
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {errorInfo.description}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {errorInfo.actionHref ? (
            <Link href={errorInfo.actionHref}>
              <Button variant="primary" className="w-full">
                {errorInfo.action}
              </Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={reset} className="w-full">
              {errorInfo.action}
            </Button>
          )}
          <Link href="/workspaces">
            <Button variant="secondary" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-2">
              <strong>Debug Info:</strong>
            </p>
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
