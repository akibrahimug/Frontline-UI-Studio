"use client";

import { useState } from "react";
import { Button } from "@refinery/ui";
import { createComponentVersionAction } from "../../actions/components";

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
} | undefined;

export function ComponentEditor({
  component,
  latestVersion,
}: {
  component: ComponentWithRelations;
  latestVersion: ComponentVersion;
}) {
  const [sourceCode, setSourceCode] = useState(latestVersion?.sourceCodeOriginal || "");
  const [version, setVersion] = useState("0.1.0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("componentId", component.id);
      formData.append("version", version);
      formData.append("sourceCodeOriginal", sourceCode);

      await createComponentVersionAction(formData);
      alert("Version saved successfully!");
    } catch (error) {
      console.error("Error saving version:", error);
      alert("Failed to save version");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Component Code
        </h2>

        {latestVersion && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Latest version: <strong>{latestVersion.version}</strong> (
              {new Date(latestVersion.createdAt).toLocaleString()})
            </p>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="version" className="block text-sm font-medium mb-2">
            Version Number
          </label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.1.0"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="sourceCode" className="block text-sm font-medium mb-2">
            Source Code
          </label>
          <textarea
            id="sourceCode"
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="// Paste your React component code here..."
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSubmitting || !sourceCode}>
            {isSubmitting ? "Saving..." : "Save Version"}
          </Button>
          <Button variant="secondary" disabled>
            Refine with AI (Coming Soon)
          </Button>
        </div>
      </div>

      {latestVersion?.sourceCodeTransformed && (
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Transformed Code
          </h2>
          <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700 overflow-x-auto">
            <code className="text-sm">{latestVersion.sourceCodeTransformed}</code>
          </pre>
        </div>
      )}

      {latestVersion?.docsMarkdown && (
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Documentation
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            {latestVersion.docsMarkdown}
          </div>
        </div>
      )}
    </div>
  );
}
