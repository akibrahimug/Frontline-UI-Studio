/**
 * Pusher authentication endpoint
 * Authenticates users for presence channels
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../../auth";
import { authenticatePresenceChannel, assertComponentAccess } from "@refinery/core";
import { rateLimiters, getRequestIdentifier } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const identifier = getRequestIdentifier(req, session.user.id);
    const rateLimitResult = rateLimiters.pusher.check(identifier);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      );
    }

    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Extract componentId from channel name (format: presence-component-{componentId})
    const channelMatch = channelName.match(/^presence-component-(.+)$/);
    if (!channelMatch) {
      return NextResponse.json(
        { error: "Invalid channel name" },
        { status: 400 }
      );
    }

    const componentId = channelMatch[1];

    // Verify component access via workspace membership
    await assertComponentAccess(componentId, session.user.id);

    // Generate a random color for the user if they don't have one
    const colors = [
      "#EF4444",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#EC4899",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const authResponse = authenticatePresenceChannel(socketId, channelName, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name || "Unknown",
        email: session.user.email || "",
        color,
      },
    });

    return NextResponse.json(authResponse, {
      headers: {
        "X-RateLimit-Limit": "60",
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
