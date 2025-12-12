/**
 * Role-Based Permission System
 * Defines what each role can do
 */

export type WorkspaceRole = "owner" | "editor" | "viewer";

export const ROLE_PERMISSIONS = {
  owner: {
    // Workspace management
    can_update_workspace: true,
    can_delete_workspace: true,
    can_make_workspace_public: true,
    // Member management
    can_add_members: true,
    can_remove_members: true,
    can_change_member_roles: true,
    can_send_invitations: true,
    // Component management
    can_create_components: true,
    can_update_components: true,
    can_delete_components: true,
    can_set_canonical_version: true,
    // View permissions
    can_view_components: true,
    can_view_analytics: true,
    can_view_activity: true,
  },
  editor: {
    // Workspace management
    can_update_workspace: false,
    can_delete_workspace: false,
    can_make_workspace_public: false,
    // Member management
    can_add_members: false,
    can_remove_members: false,
    can_change_member_roles: false,
    can_send_invitations: false,
    // Component management
    can_create_components: true,
    can_update_components: true,
    can_delete_components: true,
    can_set_canonical_version: true,
    // View permissions
    can_view_components: true,
    can_view_analytics: true,
    can_view_activity: true,
  },
  viewer: {
    // Workspace management
    can_update_workspace: false,
    can_delete_workspace: false,
    can_make_workspace_public: false,
    // Member management
    can_add_members: false,
    can_remove_members: false,
    can_change_member_roles: false,
    can_send_invitations: false,
    // Component management
    can_create_components: false,
    can_update_components: false,
    can_delete_components: false,
    can_set_canonical_version: false,
    // View permissions
    can_view_components: true,
    can_view_analytics: true,
    can_view_activity: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.owner;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Assert that a role has a specific permission
 * @throws Error if permission is denied
 */
export function assertPermission(role: WorkspaceRole, permission: Permission, action?: string) {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `PERMISSION_DENIED: ${role} role does not have permission to ${action || permission}`
    );
  }
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: WorkspaceRole) {
  return ROLE_PERMISSIONS[role];
}
