"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@refinery/ui";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Refinery UI
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {session.user.name || session.user.email}
            </div>
            <Button
              variant="secondary"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
