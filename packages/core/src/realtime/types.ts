/**
 * Realtime collaboration types
 */

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
  color: string; // Hex color for user avatar/cursor
  joinedAt: number;
}

export interface PresenceData {
  users: PresenceUser[];
}

export interface ComponentUpdateEvent {
  componentId: string;
  versionId: string;
  updatedBy: string;
  timestamp: number;
  sourceCode?: string;
  docsMarkdown?: string;
}

export interface CollaborativeEditEvent {
  componentId: string;
  userId: string;
  field: "sourceCode" | "docsMarkdown";
  value: string;
  timestamp: number;
}

export type RealtimeEvent =
  | { type: "presence:join"; data: PresenceUser }
  | { type: "presence:leave"; data: { userId: string } }
  | { type: "component:update"; data: ComponentUpdateEvent }
  | { type: "collaborative:edit"; data: CollaborativeEditEvent };

export interface RealtimeChannel {
  name: string;
  bind<T = unknown>(event: string, callback: (data: T) => void): void;
  unbind(event?: string, callback?: (data: unknown) => void): void;
  trigger(event: string, data: unknown): void;
  disconnect(): void;
}
