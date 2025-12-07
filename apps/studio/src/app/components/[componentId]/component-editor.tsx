"use client";

import { useState, useTransition } from "react";
import { Button } from "@refinery/ui";
import { refactorComponentAction } from "../../actions/llm";
import { getComponentVersionsAction } from "../../actions/components";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

      // Refresh versions list
      startTransition(async () => {
        const updatedVersions = await getComponentVersionsAction(component.id);
        setVersions(updatedVersions);

        // Select the newly created version
        const newVersion = updatedVersions.find((v) => v.id === result.versionId);
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

  return (
    <div className="space-y-6">
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
              <button
                key={version.id}
                onClick={() => handleVersionChange(version)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedVersion?.id === version.id
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="font-medium">v{version.version}</div>
                <div className="text-xs opacity-75" suppressHydrationWarning>
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </button>
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
                  onChange={(e) => setSourceCode(e.target.value)}
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
