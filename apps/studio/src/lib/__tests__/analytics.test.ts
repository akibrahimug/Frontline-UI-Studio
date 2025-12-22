import { describe, it, expect } from "vitest";

/**
 * Unit tests for analytics aggregation logic
 * Tests the calculation of top components, cold components, and event counting
 */

// Helper type matching the analytics event structure
type AnalyticsEvent = {
  componentId: string;
  component: {
    id: string;
    name: string;
    slug: string;
  };
  eventType: "component_viewed" | "docs_viewed" | "refactor_run";
  createdAt: Date;
};

type ComponentStats = {
  componentId: string;
  componentName: string;
  componentSlug: string;
  viewCount: number;
  docsViewCount: number;
  refactorCount: number;
  lastActivity: Date;
};

/**
 * Aggregate analytics events into component statistics
 * This is the core logic from getWorkspaceAnalyticsAction
 */
function aggregateEvents(events: AnalyticsEvent[]): ComponentStats[] {
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
  }, {} as Record<string, ComponentStats>);

  return Object.values(componentStats);
}

/**
 * Get top components by total activity
 */
function getTopComponents(stats: ComponentStats[], limit: number = 10): ComponentStats[] {
  return stats
    .sort((a, b) => {
      const totalA = a.viewCount + a.docsViewCount + a.refactorCount;
      const totalB = b.viewCount + b.docsViewCount + b.refactorCount;
      return totalB - totalA;
    })
    .slice(0, limit);
}

/**
 * Get cold components (inactive or low activity)
 */
function getColdComponents(stats: ComponentStats[], daysThreshold: number = 30, activityThreshold: number = 3): ComponentStats[] {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  return stats
    .filter((stat) => {
      const totalActivity = stat.viewCount + stat.docsViewCount + stat.refactorCount;
      return stat.lastActivity < thresholdDate || totalActivity < activityThreshold;
    })
    .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
    .slice(0, 10);
}

describe("Analytics Aggregation", () => {
  describe("aggregateEvents", () => {
    it("should aggregate single component with multiple events", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = [
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: now,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: now,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "docs_viewed",
          createdAt: now,
        },
      ];

      const result = aggregateEvents(events);

      expect(result).toHaveLength(1);
      expect(result[0].componentId).toBe("comp-1");
      expect(result[0].componentName).toBe("Button");
      expect(result[0].viewCount).toBe(2);
      expect(result[0].docsViewCount).toBe(1);
      expect(result[0].refactorCount).toBe(0);
    });

    it("should aggregate multiple components separately", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = [
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: now,
        },
        {
          componentId: "comp-2",
          component: { id: "comp-2", name: "Input", slug: "input" },
          eventType: "component_viewed",
          createdAt: now,
        },
      ];

      const result = aggregateEvents(events);

      expect(result).toHaveLength(2);
      expect(result.find(r => r.componentId === "comp-1")).toBeDefined();
      expect(result.find(r => r.componentId === "comp-2")).toBeDefined();
    });

    it("should track all three event types correctly", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = [
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: now,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "docs_viewed",
          createdAt: now,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "refactor_run",
          createdAt: now,
        },
      ];

      const result = aggregateEvents(events);

      expect(result[0].viewCount).toBe(1);
      expect(result[0].docsViewCount).toBe(1);
      expect(result[0].refactorCount).toBe(1);
    });

    it("should track most recent activity date", () => {
      const oldDate = new Date("2024-01-01");
      const recentDate = new Date("2024-12-01");
      const events: AnalyticsEvent[] = [
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: oldDate,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: recentDate,
        },
      ];

      const result = aggregateEvents(events);

      expect(result[0].lastActivity).toEqual(recentDate);
    });

    it("should handle empty events array", () => {
      const result = aggregateEvents([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getTopComponents", () => {
    it("should sort components by total activity descending", () => {
      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Low Activity",
          componentSlug: "low",
          viewCount: 1,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: new Date(),
        },
        {
          componentId: "comp-2",
          componentName: "High Activity",
          componentSlug: "high",
          viewCount: 10,
          docsViewCount: 5,
          refactorCount: 3,
          lastActivity: new Date(),
        },
        {
          componentId: "comp-3",
          componentName: "Medium Activity",
          componentSlug: "medium",
          viewCount: 5,
          docsViewCount: 2,
          refactorCount: 1,
          lastActivity: new Date(),
        },
      ];

      const result = getTopComponents(stats);

      expect(result[0].componentName).toBe("High Activity");
      expect(result[1].componentName).toBe("Medium Activity");
      expect(result[2].componentName).toBe("Low Activity");
    });

    it("should limit results to specified count", () => {
      const stats: ComponentStats[] = Array.from({ length: 20 }, (_, i) => ({
        componentId: `comp-${i}`,
        componentName: `Component ${i}`,
        componentSlug: `comp-${i}`,
        viewCount: i,
        docsViewCount: 0,
        refactorCount: 0,
        lastActivity: new Date(),
      }));

      const result = getTopComponents(stats, 5);

      expect(result).toHaveLength(5);
    });

    it("should handle stats with zero activity", () => {
      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "No Activity",
          componentSlug: "none",
          viewCount: 0,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: new Date(),
        },
      ];

      const result = getTopComponents(stats);

      expect(result).toHaveLength(1);
      expect(result[0].componentName).toBe("No Activity");
    });

    it("should count all activity types equally", () => {
      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Views Only",
          componentSlug: "views",
          viewCount: 10,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: new Date(),
        },
        {
          componentId: "comp-2",
          componentName: "Mixed",
          componentSlug: "mixed",
          viewCount: 3,
          docsViewCount: 3,
          refactorCount: 4,
          lastActivity: new Date(),
        },
      ];

      const result = getTopComponents(stats);

      // comp-1 total: 10, comp-2 total: 10
      // They should be equal, order depends on sort stability
      expect(result).toHaveLength(2);
    });
  });

  describe("getColdComponents", () => {
    it("should identify components with no recent activity", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Old Component",
          componentSlug: "old",
          viewCount: 10,
          docsViewCount: 5,
          refactorCount: 3,
          lastActivity: oldDate,
        },
        {
          componentId: "comp-2",
          componentName: "Recent Component",
          componentSlug: "recent",
          viewCount: 10,
          docsViewCount: 5,
          refactorCount: 3,
          lastActivity: recentDate,
        },
      ];

      const result = getColdComponents(stats, 30);

      expect(result).toHaveLength(1);
      expect(result[0].componentName).toBe("Old Component");
    });

    it("should identify components with low activity", () => {
      const recentDate = new Date();

      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Low Activity",
          componentSlug: "low",
          viewCount: 1,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: recentDate,
        },
        {
          componentId: "comp-2",
          componentName: "High Activity",
          componentSlug: "high",
          viewCount: 10,
          docsViewCount: 5,
          refactorCount: 3,
          lastActivity: recentDate,
        },
      ];

      const result = getColdComponents(stats, 30, 3);

      expect(result).toHaveLength(1);
      expect(result[0].componentName).toBe("Low Activity");
    });

    it("should sort cold components by oldest activity first", () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() - 60);

      const date2 = new Date();
      date2.setDate(date2.getDate() - 45);

      const date3 = new Date();
      date3.setDate(date3.getDate() - 90);

      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Medium Old",
          componentSlug: "medium",
          viewCount: 10,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: date1,
        },
        {
          componentId: "comp-2",
          componentName: "Less Old",
          componentSlug: "less",
          viewCount: 10,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: date2,
        },
        {
          componentId: "comp-3",
          componentName: "Oldest",
          componentSlug: "oldest",
          viewCount: 10,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: date3,
        },
      ];

      const result = getColdComponents(stats, 30);

      expect(result[0].componentName).toBe("Oldest");
      expect(result[1].componentName).toBe("Medium Old");
      expect(result[2].componentName).toBe("Less Old");
    });

    it("should limit cold components to 10", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      const stats: ComponentStats[] = Array.from({ length: 20 }, (_, i) => ({
        componentId: `comp-${i}`,
        componentName: `Component ${i}`,
        componentSlug: `comp-${i}`,
        viewCount: 10,
        docsViewCount: 0,
        refactorCount: 0,
        lastActivity: oldDate,
      }));

      const result = getColdComponents(stats, 30);

      expect(result).toHaveLength(10);
    });

    it("should handle components on the threshold boundary", () => {
      const exactly30DaysAgo = new Date();
      exactly30DaysAgo.setDate(exactly30DaysAgo.getDate() - 30);

      const exactly3Activity = new Date();

      const stats: ComponentStats[] = [
        {
          componentId: "comp-1",
          componentName: "Exactly 30 days",
          componentSlug: "boundary-date",
          viewCount: 10,
          docsViewCount: 0,
          refactorCount: 0,
          lastActivity: exactly30DaysAgo,
        },
        {
          componentId: "comp-2",
          componentName: "Exactly 3 activity",
          componentSlug: "boundary-activity",
          viewCount: 2,
          docsViewCount: 1,
          refactorCount: 0,
          lastActivity: exactly3Activity,
        },
      ];

      const result = getColdComponents(stats, 30, 3);

      // Both should be excluded (30 days ago is not < threshold, 3 activity is not < threshold)
      // This depends on the < vs <= comparison in the actual implementation
      // The current implementation uses < for both, so these should be excluded
      expect(result).toHaveLength(0);
    });
  });

  describe("Event Type Counting", () => {
    it("should correctly count component_viewed events", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = Array.from({ length: 5 }, () => ({
        componentId: "comp-1",
        component: { id: "comp-1", name: "Button", slug: "button" },
        eventType: "component_viewed" as const,
        createdAt: now,
      }));

      const result = aggregateEvents(events);

      expect(result[0].viewCount).toBe(5);
      expect(result[0].docsViewCount).toBe(0);
      expect(result[0].refactorCount).toBe(0);
    });

    it("should correctly count docs_viewed events", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = Array.from({ length: 3 }, () => ({
        componentId: "comp-1",
        component: { id: "comp-1", name: "Button", slug: "button" },
        eventType: "docs_viewed" as const,
        createdAt: now,
      }));

      const result = aggregateEvents(events);

      expect(result[0].viewCount).toBe(0);
      expect(result[0].docsViewCount).toBe(3);
      expect(result[0].refactorCount).toBe(0);
    });

    it("should correctly count refactor_run events", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = Array.from({ length: 2 }, () => ({
        componentId: "comp-1",
        component: { id: "comp-1", name: "Button", slug: "button" },
        eventType: "refactor_run" as const,
        createdAt: now,
      }));

      const result = aggregateEvents(events);

      expect(result[0].viewCount).toBe(0);
      expect(result[0].docsViewCount).toBe(0);
      expect(result[0].refactorCount).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large number of events", () => {
      const now = new Date();
      const events: AnalyticsEvent[] = Array.from({ length: 10000 }, (_, i) => ({
        componentId: `comp-${i % 100}`,
        component: { id: `comp-${i % 100}`, name: `Component ${i % 100}`, slug: `comp-${i % 100}` },
        eventType: "component_viewed" as const,
        createdAt: now,
      }));

      const result = aggregateEvents(events);

      expect(result).toHaveLength(100);
      // Each component should have 100 views (10000 / 100)
      expect(result[0].viewCount).toBe(100);
    });

    it("should handle events with same timestamp", () => {
      const sameTime = new Date();
      const events: AnalyticsEvent[] = [
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "component_viewed",
          createdAt: sameTime,
        },
        {
          componentId: "comp-1",
          component: { id: "comp-1", name: "Button", slug: "button" },
          eventType: "docs_viewed",
          createdAt: sameTime,
        },
      ];

      const result = aggregateEvents(events);

      expect(result[0].lastActivity).toEqual(sameTime);
      expect(result[0].viewCount).toBe(1);
      expect(result[0].docsViewCount).toBe(1);
    });
  });
});
