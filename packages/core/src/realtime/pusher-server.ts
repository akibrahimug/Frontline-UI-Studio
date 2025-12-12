/**
 * Server-side Pusher configuration
 * Used for triggering events and authenticating private/presence channels
 */

import Pusher from "pusher";

let pusherInstance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherInstance) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (!appId || !key || !secret) {
      throw new Error(
        "Missing Pusher configuration. Please set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_APP_KEY, and PUSHER_SECRET environment variables."
      );
    }

    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherInstance;
}

/**
 * Trigger a component update event
 */
export async function triggerComponentUpdate(
  componentId: string,
  data: {
    versionId: string;
    updatedBy: string;
    sourceCode?: string;
    docsMarkdown?: string;
  }
) {
  const pusher = getPusherServer();
  await pusher.trigger(`component-${componentId}`, "component:update", {
    componentId,
    timestamp: Date.now(),
    ...data,
  });
}

/**
 * Trigger a collaborative edit event
 */
export async function triggerCollaborativeEdit(
  componentId: string,
  data: {
    userId: string;
    field: "sourceCode" | "docsMarkdown";
    value: string;
  }
) {
  const pusher = getPusherServer();
  await pusher.trigger(`component-${componentId}`, "collaborative:edit", {
    componentId,
    timestamp: Date.now(),
    ...data,
  });
}

/**
 * Authenticate presence channel
 * Returns auth signature for client to join presence channel
 */
export function authenticatePresenceChannel(
  socketId: string,
  channelName: string,
  presenceData: {
    user_id: string;
    user_info: {
      name: string;
      email: string;
      color: string;
    };
  }
) {
  const pusher = getPusherServer();
  return pusher.authorizeChannel(socketId, channelName, presenceData);
}
