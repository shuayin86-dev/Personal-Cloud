// Role-Based Access Control (RBAC) Service
// Granular permission management

export type Role = 'admin' | 'moderator' | 'user' | 'guest' | 'service' | 'custom';
export type Permission = 
  | 'user.read' | 'user.write' | 'user.delete' | 'user.create'
  | 'file.read' | 'file.write' | 'file.delete' | 'file.share'
  | 'ai.access' | 'ai.admin'
  | 'settings.read' | 'settings.write'
  | 'admin.view_logs' | 'admin.manage_users' | 'admin.system_config'
  | 'security.mfa_enforce' | 'security.audit_logs'
  | 'analytics.view_all' | 'analytics.export'
  | 'reports.generate' | 'reports.view';

export interface RoleDefinition {
  role: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  canAssignRoles: Role[];
  hierarchyLevel: number; // 0 = highest (admin), higher = lower privilege
}

export interface UserRole {
  userId: string;
  roles: Role[];
  customPermissions?: Permission[];
  deniedPermissions?: Permission[];
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
}

export interface ResourcePermission {
  resourceId: string;
  resourceType: string;
  userId: string;
  permissions: Permission[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface PermissionRequest {
  userId: string;
  permission: Permission;
  resourceId?: string;
  reason?: string;
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'denied';
}

export class RBACService {
  private roles = new Map<Role, RoleDefinition>();
  private userRoles = new Map<string, UserRole>();
  private resourcePermissions = new Map<string, ResourcePermission[]>();
  private permissionRequests: PermissionRequest[] = [];

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default role definitions
   */
  private initializeDefaultRoles(): void {
    const adminRole: RoleDefinition = {
      role: 'admin',
      displayName: 'Administrator',
      description: 'Full system access and management',
      permissions: [
        'user.read', 'user.write', 'user.delete', 'user.create',
        'file.read', 'file.write', 'file.delete', 'file.share',
        'ai.access', 'ai.admin',
        'settings.read', 'settings.write',
        'admin.view_logs', 'admin.manage_users', 'admin.system_config',
        'security.mfa_enforce', 'security.audit_logs',
        'analytics.view_all', 'analytics.export',
        'reports.generate', 'reports.view',
      ],
      canAssignRoles: ['admin', 'moderator', 'user', 'guest'],
      hierarchyLevel: 0,
    };

    const moderatorRole: RoleDefinition = {
      role: 'moderator',
      displayName: 'Moderator',
      description: 'Manage users and content',
      permissions: [
        'user.read', 'user.write',
        'file.read', 'file.write', 'file.delete', 'file.share',
        'ai.access',
        'settings.read',
        'admin.view_logs',
        'analytics.view_all',
        'reports.view',
      ],
      canAssignRoles: ['user', 'guest'],
      hierarchyLevel: 1,
    };

    const userRole: RoleDefinition = {
      role: 'user',
      displayName: 'User',
      description: 'Standard user access',
      permissions: [
        'user.read',
        'file.read', 'file.write', 'file.delete', 'file.share',
        'ai.access',
        'settings.read', 'settings.write',
        'reports.view',
      ],
      canAssignRoles: [],
      hierarchyLevel: 2,
    };

    const guestRole: RoleDefinition = {
      role: 'guest',
      displayName: 'Guest',
      description: 'Limited guest access',
      permissions: [
        'user.read',
        'file.read',
        'ai.access',
        'reports.view',
      ],
      canAssignRoles: [],
      hierarchyLevel: 3,
    };

    this.roles.set('admin', adminRole);
    this.roles.set('moderator', moderatorRole);
    this.roles.set('user', userRole);
    this.roles.set('guest', guestRole);
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, role: Role, assignedBy: string, expiresAt?: Date): boolean {
    let userRole = this.userRoles.get(userId);

    if (!userRole) {
      userRole = {
        userId,
        roles: [],
        assignedAt: new Date(),
        assignedBy,
        expiresAt,
      };
      this.userRoles.set(userId, userRole);
    }

    if (!userRole.roles.includes(role)) {
      userRole.roles.push(role);
      userRole.assignedBy = assignedBy;
      userRole.assignedAt = new Date();
      userRole.expiresAt = expiresAt;
      return true;
    }

    return false;
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, role: Role): boolean {
    const userRole = this.userRoles.get(userId);

    if (userRole) {
      const index = userRole.roles.indexOf(role);
      if (index > -1) {
        userRole.roles.splice(index, 1);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: Permission, resourceId?: string): boolean {
    const userRole = this.userRoles.get(userId);

    if (!userRole) return false;

    // Check if role has expired
    if (userRole.expiresAt && new Date() > userRole.expiresAt) {
      return false;
    }

    // Check denied permissions
    if (userRole.deniedPermissions?.includes(permission)) {
      return false;
    }

    // Check custom permissions
    if (userRole.customPermissions?.includes(permission)) {
      return true;
    }

    // Check role permissions
    for (const role of userRole.roles) {
      const roleDefinition = this.roles.get(role);
      if (roleDefinition?.permissions.includes(permission)) {
        return true;
      }
    }

    // Check resource-specific permissions
    if (resourceId) {
      const resourcePerms = this.resourcePermissions.get(resourceId) || [];
      const userResourcePerm = resourcePerms.find((p) => p.userId === userId);
      if (userResourcePerm?.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Role[] {
    return this.userRoles.get(userId)?.roles || [];
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): Permission[] {
    const userRole = this.userRoles.get(userId);
    if (!userRole) return [];

    const permissions = new Set<Permission>();

    // Add permissions from roles
    userRole.roles.forEach((role) => {
      const roleDefinition = this.roles.get(role);
      roleDefinition?.permissions.forEach((p) => permissions.add(p));
    });

    // Add custom permissions
    userRole.customPermissions?.forEach((p) => permissions.add(p));

    // Remove denied permissions
    userRole.deniedPermissions?.forEach((p) => permissions.delete(p));

    return Array.from(permissions);
  }

  /**
   * Grant specific permission to user
   */
  grantPermission(userId: string, permission: Permission, expiresAt?: Date): void {
    let userRole = this.userRoles.get(userId);

    if (!userRole) {
      userRole = {
        userId,
        roles: [],
        customPermissions: [],
        assignedAt: new Date(),
        assignedBy: 'system',
      };
      this.userRoles.set(userId, userRole);
    }

    if (!userRole.customPermissions) {
      userRole.customPermissions = [];
    }

    if (!userRole.customPermissions.includes(permission)) {
      userRole.customPermissions.push(permission);
    }
  }

  /**
   * Deny specific permission to user
   */
  denyPermission(userId: string, permission: Permission): void {
    let userRole = this.userRoles.get(userId);

    if (!userRole) {
      userRole = {
        userId,
        roles: [],
        deniedPermissions: [],
        assignedAt: new Date(),
        assignedBy: 'system',
      };
      this.userRoles.set(userId, userRole);
    }

    if (!userRole.deniedPermissions) {
      userRole.deniedPermissions = [];
    }

    if (!userRole.deniedPermissions.includes(permission)) {
      userRole.deniedPermissions.push(permission);
    }
  }

  /**
   * Grant permission for specific resource
   */
  grantResourcePermission(
    userId: string,
    resourceId: string,
    resourceType: string,
    permissions: Permission[],
    grantedBy: string,
    expiresAt?: Date
  ): void {
    if (!this.resourcePermissions.has(resourceId)) {
      this.resourcePermissions.set(resourceId, []);
    }

    const resourcePerms = this.resourcePermissions.get(resourceId)!;
    const existing = resourcePerms.find((p) => p.userId === userId);

    if (existing) {
      existing.permissions = permissions;
      existing.expiresAt = expiresAt;
    } else {
      resourcePerms.push({
        resourceId,
        resourceType,
        userId,
        permissions,
        grantedAt: new Date(),
        grantedBy,
        expiresAt,
      });
    }
  }

  /**
   * Request permission
   */
  requestPermission(
    userId: string,
    permission: Permission,
    resourceId?: string,
    reason?: string
  ): PermissionRequest {
    const request: PermissionRequest = {
      userId,
      permission,
      resourceId,
      reason,
      requestedAt: new Date(),
      status: 'pending',
    };

    this.permissionRequests.push(request);
    return request;
  }

  /**
   * Approve permission request
   */
  approvePermissionRequest(requestId: string, approvedBy: string): boolean {
    const request = this.permissionRequests[this.permissionRequests.findIndex((r) => r.userId === requestId)];

    if (request) {
      request.status = 'approved';
      request.approvedAt = new Date();
      request.approvedBy = approvedBy;

      // Grant the permission
      this.grantPermission(request.userId, request.permission);
      return true;
    }

    return false;
  }

  /**
   * Deny permission request
   */
  denyPermissionRequest(requestId: string, approvedBy: string): boolean {
    const request = this.permissionRequests[this.permissionRequests.findIndex((r) => r.userId === requestId)];

    if (request) {
      request.status = 'denied';
      request.approvedAt = new Date();
      request.approvedBy = approvedBy;
      return true;
    }

    return false;
  }

  /**
   * Get pending permission requests
   */
  getPendingRequests(): PermissionRequest[] {
    return this.permissionRequests.filter((r) => r.status === 'pending');
  }

  /**
   * Get role definition
   */
  getRoleDefinition(role: Role): RoleDefinition | null {
    return this.roles.get(role) || null;
  }

  /**
   * Get all roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  /**
   * Create custom role
   */
  createCustomRole(
    roleName: string,
    displayName: string,
    description: string,
    permissions: Permission[],
    hierarchyLevel: number
  ): RoleDefinition {
    const roleId = `custom-${roleName}` as Role;

    const customRole: RoleDefinition = {
      role: roleId,
      displayName,
      description,
      permissions,
      canAssignRoles: [],
      hierarchyLevel,
    };

    this.roles.set(roleId, customRole);
    return customRole;
  }
}

// Export singleton instance
export const rbacService = new RBACService();
