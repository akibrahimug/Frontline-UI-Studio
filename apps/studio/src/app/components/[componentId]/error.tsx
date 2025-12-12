"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@refinery/ui";
import { Header } from "@/components/header";

export default function ComponentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Component page error:", error);
  }, [error]);

  const getErrorMessage = () => {
    const message = error.message;

    if (message === "COMPONENT_NOT_FOUND") {
      return {
        title: "Component Not Found",
        description:
          "The component you're trying to access doesn't exist or has been deleted.",
      };
    }

    if (message === "COMPONENT_ACCESS_DENIED") {
      return {
        title: "Access Denied",
        description:
          "You don't have permission to view this component. The component belongs to a workspace you're not a member of.",
        helpText:
          "Ask the workspace owner to invite you as a member to access this component.",
      };
    }

    return {
      title: "Error Loading Component",
      description:
        "An error occurred while loading the component. Please try again.",
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-6">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {errorInfo.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {errorInfo.description}
          </p>

          {errorInfo.helpText && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tip:</strong> {errorInfo.helpText}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/workspaces">
              <Button variant="primary">View My Workspaces</Button>
            </Link>
            <Button variant="secondary" onClick={reset}>
              Try Again
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-2">
                <strong>Debug Info:</strong>
              </p>
              <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-2 overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
