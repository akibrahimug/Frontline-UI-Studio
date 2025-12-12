/**
 * Analytics tracking server actions
 * Track component views, docs views, and refactor runs
 */

"use server";

import { auth } from "@/../../auth";
import { db, assertComponentAccess, assertWorkspaceMember } from "@refinery/core";

export async function trackComponentViewAction(componentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  try {
    // Verify component access via workspace membership
    const { component } = await assertComponentAccess(componentId, session.user.id);

    await db.analyticsEvent.create({
      data: {
        workspaceId: component.workspaceId,
        componentId,
        eventType: "component_viewed",
        metadata: {
          userId: session.user.id,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to track component view:", error);
    return { success: false };
  }
}

export async function trackDocsViewAction(componentId: string, versionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  try {
    // Verify component access via workspace membership
    const { component } = await assertComponentAccess(componentId, session.user.id);

    await db.analyticsEvent.create({
      data: {
        workspaceId: component.workspaceId,
        componentId,
        eventType: "docs_viewed",
        metadata: {
          userId: session.user.id,
          versionId,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to track docs view:", error);
    return { success: false };
  }
}

export async function trackRefactorRunAction(
  componentId: string,
  versionId: string,
  metadata?: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  try {
    // Verify component access via workspace membership
    const { component } = await assertComponentAccess(componentId, session.user.id);

    await db.analyticsEvent.create({
      data: {
        workspaceId: component.workspaceId,
        componentId,
        eventType: "refactor_run",
        metadata: {
          userId: session.user.id,
          versionId,
          ...metadata,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to track refactor run:", error);
    return { success: false };
  }
}

/**
 * Get analytics for a workspace
 */
export async function getWorkspaceAnalyticsAction(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify workspace membership
  await assertWorkspaceMember(workspaceId, session.user.id);

  // Get all events for the workspace
  const events = await db.analyticsEvent.findMany({
    where: {
      workspaceId,
    },
    include: {
      component: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1000, // Limit to recent 1000 events
  });

  // Calculate top components (most viewed)
  const componentStats = events.reduce((acc, event) => {
    const key = event.componentId;
    if (!acc[key]) {
      acc[key] = {
        componentId: event.componentId,
        componentName: event.component.name,
        componentSlug: event.component.slug,
        viewCount: 0,
        docsViewCount: 0,
        refactorCount: 0,
        lastActivity: event.createdAt,
      };
    }

    if (event.eventType === "component_viewed") {
      acc[key].viewCount++;
    } else if (event.eventType === "docs_viewed") {
      acc[key].docsViewCount++;
    } else if (event.eventType === "refactor_run") {
      acc[key].refactorCount++;
    }

    // Update last activity if this event is more recent
    if (event.createdAt > acc[key].lastActivity) {
      acc[key].lastActivity = event.createdAt;
    }

    return acc;
  }, {} as Record<string, {
    componentId: string;
    componentName: string;
    componentSlug: string;
    viewCount: number;
    docsViewCount: number;
    refactorCount: number;
    lastActivity: Date;
  }>);

  const stats = Object.values(componentStats);

  // Top components by total activity
  const topComponents = stats
    .sort((a, b) => {
      const totalA = a.viewCount + a.docsViewCount + a.refactorCount;
      const totalB = b.viewCount + b.docsViewCount + b.refactorCount;
      return totalB - totalA;
    })
    .slice(0, 10);

  // Cold components (no activity in last 30 days or very low activity)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const coldComponents = stats
    .filter((stat) => {
      const totalActivity = stat.viewCount + stat.docsViewCount + stat.refactorCount;
      return stat.lastActivity < thirtyDaysAgo || totalActivity < 3;
    })
    .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
    .slice(0, 10);

  return {
    topComponents,
    coldComponents,
    totalEvents: events.length,
  };
}
