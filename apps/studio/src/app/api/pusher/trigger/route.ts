/**
 * Pusher trigger endpoint
 * Triggers collaborative edit events
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../../auth";
import { triggerCollaborativeEdit, assertComponentAccess } from "@refinery/core";
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

    const body = await req.json();
    const { componentId, field, value } = body;

    if (!componentId || !field || typeof value !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    if (field !== "sourceCode" && field !== "docsMarkdown") {
      return NextResponse.json(
        { error: "Invalid field. Must be sourceCode or docsMarkdown" },
        { status: 400 }
      );
    }

    // Verify component access via workspace membership
    await assertComponentAccess(componentId, session.user.id);

    await triggerCollaborativeEdit(componentId, {
      userId: session.user.id,
      field,
      value,
    });

    return NextResponse.json({ success: true }, {
      headers: {
        "X-RateLimit-Limit": "60",
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    console.error("Pusher trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
