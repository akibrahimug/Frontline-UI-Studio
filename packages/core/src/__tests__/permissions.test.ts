import { describe, it, expect } from "vitest";
import {
  WorkspaceRole,
  Permission,
  hasPermission,
  assertPermission,
  getRolePermissions,
  ROLE_PERMISSIONS,
} from "../permissions";

/**
 * Unit tests for Role-Based Access Control (RBAC) system
 * Tests permission checks for owner, editor, and viewer roles
 */

describe("Permissions System", () => {
  describe("hasPermission", () => {
    describe("Owner Role", () => {
      const role: WorkspaceRole = "owner";

      it("should have all workspace management permissions", () => {
        expect(hasPermission(role, "can_update_workspace")).toBe(true);
        expect(hasPermission(role, "can_delete_workspace")).toBe(true);
        expect(hasPermission(role, "can_make_workspace_public")).toBe(true);
      });

      it("should have all member management permissions", () => {
        expect(hasPermission(role, "can_add_members")).toBe(true);
        expect(hasPermission(role, "can_remove_members")).toBe(true);
        expect(hasPermission(role, "can_change_member_roles")).toBe(true);
        expect(hasPermission(role, "can_send_invitations")).toBe(true);
      });

      it("should have all component management permissions", () => {
        expect(hasPermission(role, "can_create_components")).toBe(true);
        expect(hasPermission(role, "can_update_components")).toBe(true);
        expect(hasPermission(role, "can_delete_components")).toBe(true);
        expect(hasPermission(role, "can_set_canonical_version")).toBe(true);
      });

      it("should have all view permissions", () => {
        expect(hasPermission(role, "can_view_components")).toBe(true);
        expect(hasPermission(role, "can_view_analytics")).toBe(true);
        expect(hasPermission(role, "can_view_activity")).toBe(true);
      });
    });

    describe("Editor Role", () => {
      const role: WorkspaceRole = "editor";

      it("should NOT have workspace management permissions", () => {
        expect(hasPermission(role, "can_update_workspace")).toBe(false);
        expect(hasPermission(role, "can_delete_workspace")).toBe(false);
        expect(hasPermission(role, "can_make_workspace_public")).toBe(false);
      });

      it("should NOT have member management permissions", () => {
        expect(hasPermission(role, "can_add_members")).toBe(false);
        expect(hasPermission(role, "can_remove_members")).toBe(false);
        expect(hasPermission(role, "can_change_member_roles")).toBe(false);
        expect(hasPermission(role, "can_send_invitations")).toBe(false);
      });

      it("should have component management permissions", () => {
        expect(hasPermission(role, "can_create_components")).toBe(true);
        expect(hasPermission(role, "can_update_components")).toBe(true);
        expect(hasPermission(role, "can_delete_components")).toBe(true);
        expect(hasPermission(role, "can_set_canonical_version")).toBe(true);
      });

      it("should have view permissions", () => {
        expect(hasPermission(role, "can_view_components")).toBe(true);
        expect(hasPermission(role, "can_view_analytics")).toBe(true);
        expect(hasPermission(role, "can_view_activity")).toBe(true);
      });
    });

    describe("Viewer Role", () => {
      const role: WorkspaceRole = "viewer";

      it("should NOT have workspace management permissions", () => {
        expect(hasPermission(role, "can_update_workspace")).toBe(false);
        expect(hasPermission(role, "can_delete_workspace")).toBe(false);
        expect(hasPermission(role, "can_make_workspace_public")).toBe(false);
      });

      it("should NOT have member management permissions", () => {
        expect(hasPermission(role, "can_add_members")).toBe(false);
        expect(hasPermission(role, "can_remove_members")).toBe(false);
        expect(hasPermission(role, "can_change_member_roles")).toBe(false);
        expect(hasPermission(role, "can_send_invitations")).toBe(false);
      });

      it("should NOT have component management permissions", () => {
        expect(hasPermission(role, "can_create_components")).toBe(false);
        expect(hasPermission(role, "can_update_components")).toBe(false);
        expect(hasPermission(role, "can_delete_components")).toBe(false);
        expect(hasPermission(role, "can_set_canonical_version")).toBe(false);
      });

      it("should have view permissions", () => {
        expect(hasPermission(role, "can_view_components")).toBe(true);
        expect(hasPermission(role, "can_view_analytics")).toBe(true);
        expect(hasPermission(role, "can_view_activity")).toBe(true);
      });
    });
  });

  describe("assertPermission", () => {
    it("should not throw for owner with any permission", () => {
      expect(() => {
        assertPermission("owner", "can_delete_workspace");
      }).not.toThrow();

      expect(() => {
        assertPermission("owner", "can_create_components");
      }).not.toThrow();
    });

    it("should throw for editor trying workspace management", () => {
      expect(() => {
        assertPermission("editor", "can_update_workspace");
      }).toThrow("PERMISSION_DENIED");

      expect(() => {
        assertPermission("editor", "can_delete_workspace");
      }).toThrow("PERMISSION_DENIED");
    });

    it("should not throw for editor with component permissions", () => {
      expect(() => {
        assertPermission("editor", "can_create_components");
      }).not.toThrow();

      expect(() => {
        assertPermission("editor", "can_update_components");
      }).not.toThrow();
    });

    it("should throw for viewer trying to create components", () => {
      expect(() => {
        assertPermission("viewer", "can_create_components");
      }).toThrow("PERMISSION_DENIED");

      expect(() => {
        assertPermission("viewer", "can_update_components");
      }).toThrow("PERMISSION_DENIED");
    });

    it("should not throw for viewer with view permissions", () => {
      expect(() => {
        assertPermission("viewer", "can_view_components");
      }).not.toThrow();

      expect(() => {
        assertPermission("viewer", "can_view_analytics");
      }).not.toThrow();
    });

    it("should include custom action in error message", () => {
      expect(() => {
        assertPermission("viewer", "can_delete_workspace", "delete this workspace");
      }).toThrow("delete this workspace");
    });

    it("should include role in error message", () => {
      expect(() => {
        assertPermission("editor", "can_add_members");
      }).toThrow("editor role");
    });

    it("should include permission in error message when no custom action", () => {
      expect(() => {
        assertPermission("viewer", "can_update_components");
      }).toThrow("can_update_components");
    });
  });

  describe("getRolePermissions", () => {
    it("should return all permissions for owner", () => {
      const permissions = getRolePermissions("owner");

      expect(permissions).toBeDefined();
      expect(permissions.can_update_workspace).toBe(true);
      expect(permissions.can_view_components).toBe(true);
      expect(Object.keys(permissions).length).toBeGreaterThan(0);
    });

    it("should return all permissions for editor", () => {
      const permissions = getRolePermissions("editor");

      expect(permissions).toBeDefined();
      expect(permissions.can_create_components).toBe(true);
      expect(permissions.can_update_workspace).toBe(false);
    });

    it("should return all permissions for viewer", () => {
      const permissions = getRolePermissions("viewer");

      expect(permissions).toBeDefined();
      expect(permissions.can_view_components).toBe(true);
      expect(permissions.can_create_components).toBe(false);
    });

    it("should return same object for same role", () => {
      const perms1 = getRolePermissions("owner");
      const perms2 = getRolePermissions("owner");

      expect(perms1).toBe(perms2);
    });
  });

  describe("Permission Consistency", () => {
    it("all roles should have same permission keys", () => {
      const ownerKeys = Object.keys(ROLE_PERMISSIONS.owner).sort();
      const editorKeys = Object.keys(ROLE_PERMISSIONS.editor).sort();
      const viewerKeys = Object.keys(ROLE_PERMISSIONS.viewer).sort();

      expect(ownerKeys).toEqual(editorKeys);
      expect(editorKeys).toEqual(viewerKeys);
    });

    it("viewer should be most restrictive role", () => {
      const viewerPerms = ROLE_PERMISSIONS.viewer;
      const truePermissions = Object.entries(viewerPerms).filter(([_, value]) => value === true);

      // Viewer should only have view permissions
      truePermissions.forEach(([key]) => {
        expect(key).toMatch(/^can_view_/);
      });
    });

    it("owner should have all permissions as true", () => {
      const ownerPerms = ROLE_PERMISSIONS.owner;
      const allPermissions = Object.values(ownerPerms);

      expect(allPermissions.every(perm => perm === true)).toBe(true);
    });

    it("editor should have more permissions than viewer", () => {
      const editorPerms = ROLE_PERMISSIONS.editor;
      const viewerPerms = ROLE_PERMISSIONS.viewer;

      const editorTrueCount = Object.values(editorPerms).filter(v => v === true).length;
      const viewerTrueCount = Object.values(viewerPerms).filter(v => v === true).length;

      expect(editorTrueCount).toBeGreaterThan(viewerTrueCount);
    });

    it("owner should have more permissions than editor", () => {
      const ownerPerms = ROLE_PERMISSIONS.owner;
      const editorPerms = ROLE_PERMISSIONS.editor;

      const ownerTrueCount = Object.values(ownerPerms).filter(v => v === true).length;
      const editorTrueCount = Object.values(editorPerms).filter(v => v === true).length;

      expect(ownerTrueCount).toBeGreaterThan(editorTrueCount);
    });
  });

  describe("Permission Hierarchies", () => {
    it("should follow hierarchy: Owner > Editor > Viewer for workspace management", () => {
      const workspacePerms: Permission[] = [
        "can_update_workspace",
        "can_delete_workspace",
        "can_make_workspace_public",
      ];

      workspacePerms.forEach(perm => {
        expect(hasPermission("owner", perm)).toBe(true);
        expect(hasPermission("editor", perm)).toBe(false);
        expect(hasPermission("viewer", perm)).toBe(false);
      });
    });

    it("should follow hierarchy: Owner > Editor > Viewer for member management", () => {
      const memberPerms: Permission[] = [
        "can_add_members",
        "can_remove_members",
        "can_change_member_roles",
        "can_send_invitations",
      ];

      memberPerms.forEach(perm => {
        expect(hasPermission("owner", perm)).toBe(true);
        expect(hasPermission("editor", perm)).toBe(false);
        expect(hasPermission("viewer", perm)).toBe(false);
      });
    });

    it("should allow Owner and Editor for component management, but not Viewer", () => {
      const componentPerms: Permission[] = [
        "can_create_components",
        "can_update_components",
        "can_delete_components",
        "can_set_canonical_version",
      ];

      componentPerms.forEach(perm => {
        expect(hasPermission("owner", perm)).toBe(true);
        expect(hasPermission("editor", perm)).toBe(true);
        expect(hasPermission("viewer", perm)).toBe(false);
      });
    });

    it("should allow all roles for view permissions", () => {
      const viewPerms: Permission[] = [
        "can_view_components",
        "can_view_analytics",
        "can_view_activity",
      ];

      viewPerms.forEach(perm => {
        expect(hasPermission("owner", perm)).toBe(true);
        expect(hasPermission("editor", perm)).toBe(true);
        expect(hasPermission("viewer", perm)).toBe(true);
      });
    });
  });

  describe("Type Safety", () => {
    it("should handle all defined workspace roles", () => {
      const roles: WorkspaceRole[] = ["owner", "editor", "viewer"];

      roles.forEach(role => {
        expect(() => {
          hasPermission(role, "can_view_components");
        }).not.toThrow();
      });
    });

    it("should handle all defined permissions", () => {
      const permissions = Object.keys(ROLE_PERMISSIONS.owner) as Permission[];

      permissions.forEach(permission => {
        expect(() => {
          hasPermission("owner", permission);
        }).not.toThrow();
      });
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should prevent viewer from modifying workspace settings", () => {
      expect(() => {
        assertPermission("viewer", "can_update_workspace", "change workspace settings");
      }).toThrow();
    });

    it("should allow editor to create and edit components", () => {
      expect(() => {
        assertPermission("editor", "can_create_components");
        assertPermission("editor", "can_update_components");
        assertPermission("editor", "can_delete_components");
      }).not.toThrow();
    });

    it("should prevent editor from managing team members", () => {
      expect(() => {
        assertPermission("editor", "can_add_members", "invite team members");
      }).toThrow();
    });

    it("should allow owner to perform all administrative tasks", () => {
      expect(() => {
        assertPermission("owner", "can_delete_workspace");
        assertPermission("owner", "can_remove_members");
        assertPermission("owner", "can_make_workspace_public");
        assertPermission("owner", "can_change_member_roles");
      }).not.toThrow();
    });

    it("should allow all roles to view analytics and activity logs", () => {
      const roles: WorkspaceRole[] = ["owner", "editor", "viewer"];

      roles.forEach(role => {
        expect(() => {
          assertPermission(role, "can_view_analytics");
          assertPermission(role, "can_view_activity");
        }).not.toThrow();
      });
    });
  });
});
