"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@refinery/ui";
import { refactorComponentAction } from "../../actions/llm";
import { getComponentVersionsAction, setCanonicalVersionAction } from "../../actions/components";
import { trackComponentViewAction, trackDocsViewAction, trackRefactorRunAction } from "../../actions/analytics";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePresence } from "@/hooks/use-presence";
import { useCollaborativeEdit } from "@/hooks/use-collaborative-edit";
import { PresenceIndicator } from "@/components/presence-indicator";
import { useSession } from "next-auth/react";

type ComponentWithRelations = {
  id: string;
  name: string;
  slug: string;
  status: string;
  workspaceId: string;
};

type ComponentVersion = {
  id: string;
  version: string;
  sourceCodeOriginal: string;
  sourceCodeTransformed: string | null;
  docsMarkdown: string | null;
  isCanonical: boolean;
  createdAt: Date;
};

type Tab = "code" | "docs";

export function ComponentEditor({
  component,
  initialVersions,
}: {
  component: ComponentWithRelations;
  initialVersions: ComponentVersion[];
}) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const [sourceCode, setSourceCode] = useState(
    initialVersions[0]?.sourceCodeOriginal || ""
  );
  const [selectedVersion, setSelectedVersion] = useState<ComponentVersion | null>(
    initialVersions[0] || null
  );
  const [versions, setVersions] = useState<ComponentVersion[]>(initialVersions);
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Presence system
  const { users, isConnected } = usePresence(
    component.id,
    session?.user?.id || ""
  );

  // Collaborative editing
  const { sendUpdate, isOutOfSync, lastRemoteUpdate, syncWithRemote } =
    useCollaborativeEdit({
      componentId: component.id,
      field: "sourceCode",
      currentUserId: session?.user?.id || "",
      onRemoteUpdate: (value) => {
        setSourceCode(value);
      },
    });

  // Track component view on mount
  useEffect(() => {
    trackComponentViewAction(component.id);
  }, [component.id]);

  // Track docs view when switching to docs tab
  useEffect(() => {
    if (activeTab === "docs" && selectedVersion) {
      trackDocsViewAction(component.id, selectedVersion.id);
    }
  }, [activeTab, component.id, selectedVersion]);

  const handleRefactor = async () => {
    if (!sourceCode.trim()) {
      setError("Please enter source code to refactor");
      return;
    }

    setIsRefactoring(true);
    setError(null);

    try {
      const result = await refactorComponentAction(component.id, sourceCode);

      if (!result.success) {
        setError(result.error || "Failed to refactor component");
        return;
      }

      // Track refactor run
      if (result.versionId) {
        trackRefactorRunAction(component.id, result.versionId);
      }

      // Refresh versions list
      startTransition(async () => {
        const updatedVersions = await getComponentVersionsAction(component.id);
        setVersions(updatedVersions);

        // Select the newly created version
        const newVersion = updatedVersions.find((v: ComponentVersion) => v.id === result.versionId);
        if (newVersion) {
          setSelectedVersion(newVersion);
          setSourceCode(newVersion.sourceCodeOriginal);
        }
      });
    } catch (err) {
      console.error("Refactor error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsRefactoring(false);
    }
  };

  const handleVersionChange = (version: ComponentVersion) => {
    setSelectedVersion(version);
    setSourceCode(version.sourceCodeOriginal);
  };

  const handleSetCanonical = async (versionId: string) => {
    try {
      await setCanonicalVersionAction(versionId);

      // Refresh versions list to show updated canonical status
      startTransition(async () => {
        const updatedVersions = await getComponentVersionsAction(component.id);
        setVersions(updatedVersions);
      });
    } catch (err) {
      console.error("Error setting canonical version:", err);
      setError(err instanceof Error ? err.message : "Failed to set canonical version");
    }
  };

  return (
    <div className="space-y-6">
      {/* Presence Indicator */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
        <PresenceIndicator users={users} isConnected={isConnected} />
      </div>

      {/* Out of Sync Warning */}
      {isOutOfSync && lastRemoteUpdate && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Content updated by another user
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Your local changes will be overwritten if you sync.
              </p>
            </div>
            <Button
              onClick={syncWithRemote}
              variant="secondary"
              className="text-xs"
            >
              Sync Now
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Version History Sidebar */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Version History
        </h3>
        {versions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No versions yet</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`rounded-md border transition-colors ${
                  selectedVersion?.id === version.id
                    ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                }`}
              >
                <button
                  onClick={() => handleVersionChange(version)}
                  className="w-full text-left px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">v{version.version}</div>
                    {version.isCanonical && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-semibold">
                        Canonical
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-75 mt-1" suppressHydrationWarning>
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                </button>
                {!version.isCanonical && (
                  <div className="px-3 pb-2">
                    <button
                      onClick={() => handleSetCanonical(version.id)}
                      disabled={isPending}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                    >
                      Set as Canonical
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "code"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "docs"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
              disabled={!selectedVersion?.docsMarkdown}
            >
              Documentation
              {!selectedVersion?.docsMarkdown && (
                <span className="ml-2 text-xs">(No docs yet)</span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "code" ? (
            <div className="space-y-6">
              {/* Original Code */}
              <div>
                <label htmlFor="sourceCode" className="block text-sm font-medium mb-2">
                  Original Code
                </label>
                <textarea
                  id="sourceCode"
                  value={sourceCode}
                  onChange={(e) => {
                    setSourceCode(e.target.value);
                    sendUpdate(e.target.value);
                  }}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="// Paste your React component code here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRefactor}
                  disabled={isRefactoring || !sourceCode.trim()}
                >
                  {isRefactoring ? "Refactoring..." : "Run AI Refactor"}
                </Button>
              </div>

              {/* Transformed Code */}
              {selectedVersion?.sourceCodeTransformed && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Transformed Code</h3>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700 overflow-x-auto">
                    <code className="text-sm font-mono">
                      {selectedVersion.sourceCodeTransformed}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {selectedVersion?.docsMarkdown ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedVersion.docsMarkdown}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No documentation available for this version.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
