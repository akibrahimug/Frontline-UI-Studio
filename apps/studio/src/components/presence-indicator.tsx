/**
 * Presence indicator showing active users
 */

"use client";

import type { PresenceUser } from "@refinery/core";

interface PresenceIndicatorProps {
  users: PresenceUser[];
  isConnected: boolean;
}

export function PresenceIndicator({ users, isConnected }: PresenceIndicatorProps) {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span>No one else viewing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-medium">
          {users.length} {users.length === 1 ? "person" : "people"} viewing
        </span>
      </div>

      {/* User Avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
