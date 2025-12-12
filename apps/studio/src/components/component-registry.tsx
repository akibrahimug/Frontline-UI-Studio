/**
 * Component Registry View
 * Displays components with filtering, search, and canonical version info
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@refinery/ui";

type ComponentWithVersion = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt: Date;
  versions: Array<{
    id: string;
    version: string;
    isCanonical: boolean;
  }>;
};

interface ComponentRegistryProps {
  components: ComponentWithVersion[];
  workspaceId: string;
}

export function ComponentRegistry({ components, workspaceId }: ComponentRegistryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      const matchesSearch = component.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || component.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [components, searchQuery, statusFilter]);

  const canonicalVersion = (component: ComponentWithVersion) => {
    return component.versions.find((v) => v.isCanonical);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search components
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <label htmlFor="status" className="sr-only">
              Filter by status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="canonical">Canonical</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredComponents.length} of {components.length} components
        </div>
      </div>

      {/* Component Registry Table */}
      {filteredComponents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {components.length === 0 ? "No components yet" : "No matching components"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {components.length === 0
              ? "Create your first component to get started"
              : "Try adjusting your search or filters"}
          </p>
          {components.length === 0 && (
            <Link href={`/workspaces/${workspaceId}/components/new`}>
              <Button>Create Component</Button>
            </Link>
          )}
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
                  Canonical Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredComponents.map((component) => {
                const canonical = canonicalVersion(component);
                return (
                  <tr
                    key={component.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/components/${component.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {component.name}
                      </Link>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {component.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {canonical ? (
                        <span className="font-mono">v{canonical.version}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 italic">
                          None
                        </span>
                      )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
                      {new Date(component.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
