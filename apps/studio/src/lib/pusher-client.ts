/**
 * Client-side Pusher configuration
 * Singleton instance for the entire app
 */

import PusherClient from "pusher-js";

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (!key) {
      throw new Error(
        "Missing NEXT_PUBLIC_PUSHER_APP_KEY environment variable"
      );
    }

    pusherInstance = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
  }

  return pusherInstance;
}

/**
 * Get a channel by name
 */
export function getChannel(channelName: string) {
  const pusher = getPusherClient();
  return pusher.subscribe(channelName);
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeChannel(channelName: string) {
  const pusher = getPusherClient();
  pusher.unsubscribe(channelName);
}
