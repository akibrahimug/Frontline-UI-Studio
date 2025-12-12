/**
 * React hook for collaborative editing
 * Handles debounced updates and conflict resolution
 */

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { CollaborativeEditEvent } from "@refinery/core";

interface UseCollaborativeEditOptions {
  componentId: string;
  field: "sourceCode" | "docsMarkdown";
  currentUserId: string;
  onRemoteUpdate: (value: string, userId: string) => void;
  debounceMs?: number;
}

export function useCollaborativeEdit({
  componentId,
  field,
  currentUserId,
  onRemoteUpdate,
  debounceMs = 500,
}: UseCollaborativeEditOptions) {
  const [isOutOfSync, setIsOutOfSync] = useState(false);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<{
    userId: string;
    timestamp: number;
  } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentValueRef = useRef<string>("");

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `component-${componentId}`;
    const channel = pusher.subscribe(channelName);

    const handleCollaborativeEdit = (event: CollaborativeEditEvent) => {
      // Ignore our own updates
      if (event.userId === currentUserId) return;

      // Only handle updates for the same field
      if (event.field !== field) return;

      // Check if we have unsent local changes
      if (debounceTimerRef.current) {
        setIsOutOfSync(true);
      }

      setLastRemoteUpdate({
        userId: event.userId,
        timestamp: event.timestamp,
      });

      onRemoteUpdate(event.value, event.userId);
    };

    channel.bind("collaborative:edit", handleCollaborativeEdit);

    return () => {
      channel.unbind("collaborative:edit", handleCollaborativeEdit);
      pusher.unsubscribe(channelName);
    };
  }, [componentId, field, currentUserId, onRemoteUpdate]);

  const sendUpdate = useCallback(
    async (value: string) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Don't send if value hasn't changed
      if (value === lastSentValueRef.current) {
        return;
      }

      // Debounce the update
      debounceTimerRef.current = setTimeout(async () => {
        try {
          lastSentValueRef.current = value;

          await fetch("/api/pusher/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              componentId,
              field,
              value,
            }),
          });

          setIsOutOfSync(false);
        } catch (error) {
          console.error("Failed to send collaborative edit:", error);
        }
      }, debounceMs);
    },
    [componentId, field, debounceMs]
  );

  const syncWithRemote = useCallback(() => {
    setIsOutOfSync(false);
    setLastRemoteUpdate(null);
  }, []);

  return {
    sendUpdate,
    isOutOfSync,
    lastRemoteUpdate,
    syncWithRemote,
  };
}
