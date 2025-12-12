/**
 * React hook for presence system
 * Shows who else is viewing the component
 */

"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceUser } from "@refinery/core";

export function usePresence(componentId: string, currentUserId: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `presence-component-${componentId}`;
    const channel = pusher.subscribe(channelName);

    // Handle presence events
    channel.bind("pusher:subscription_succeeded", (members: { count: number; members: Record<string, { name: string; email: string; color: string }> }) => {
      const memberList: PresenceUser[] = Object.entries(members.members).map(
        ([id, info]) => ({
          id,
          name: info.name,
          email: info.email,
          color: info.color,
          joinedAt: Date.now(),
        })
      );
      setUsers(memberList.filter((u) => u.id !== currentUserId));
      setIsConnected(true);
    });

    channel.bind("pusher:member_added", (member: { id: string; info: { name: string; email: string; color: string } }) => {
      if (member.id !== currentUserId) {
        setUsers((prev) => [
          ...prev,
          {
            id: member.id,
            name: member.info.name,
            email: member.info.email,
            color: member.info.color,
            joinedAt: Date.now(),
          },
        ]);
      }
    });

    channel.bind("pusher:member_removed", (member: { id: string }) => {
      setUsers((prev) => prev.filter((u) => u.id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      setIsConnected(false);
    };
  }, [componentId, currentUserId]);

  return { users, isConnected };
}
