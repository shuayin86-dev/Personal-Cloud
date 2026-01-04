import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Lock,
  Users,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  rbacService,
  type Role,
  type Permission,
  type RoleDefinition,
} from '@/lib/rbac-service';

interface RBACManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERMISSION_GROUPS: Record<string, Permission[]> = {
  'User Management': [
    'user_read',
    'user_write',
    'user_delete',
    'user_create',
    'user_impersonate',
  ],
  'File Operations': [
    'file_read',
    'file_write',
    'file_delete',
    'file_share',
    'file_delete_others',
  ],
  'AI Services': ['ai_access', 'ai_premium', 'ai_admin'],
  'Settings': ['settings_read', 'settings_write', 'settings_export'],
  'Admin': [
    'admin_view_logs',
    'admin_manage_users',
    'admin_system_config',
    'admin_backup',
  ],
  'Security': ['security_mfa_enforce', 'security_audit_logs', 'security_encryption'],
  'Analytics': ['analytics_view_all', 'analytics_export', 'analytics_custom_reports'],
  'Reporting': ['reporting_generate', 'reporting_view', 'reporting_schedule'],
};

export const RBACManagementPanel: React.FC<RBACManagementPanelProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('roles');
  const [allRoles, setAllRoles] = useState<RoleDefinition[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string[]>>(new Map());
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRoleData = () => {
      // Get default roles
      const roles = rbacService.getAllRoles?.() || [];
      setAllRoles(roles);
    };

    loadRoleData();
  }, [isOpen]);

  const handleAssignRole = () => {
    if (selectedUser && selectedRole) {
      rbacService.assignRole(selectedUser, selectedRole as Role);
      setSelectedUser('');
      setSelectedRole('');
    }
  };

  const handleCreateCustomRole = () => {
    if (newRoleName && newRolePermissions.length > 0) {
      rbacService.createCustomRole(newRoleName as Role, newRolePermissions);
      setNewRoleName('');
      setNewRolePermissions([]);
      setShowCreateRoleDialog(false);

      // Reload roles
      const roles = rbacService.getAllRoles?.() || [];
      setAllRoles(roles);
    }
  };

  const togglePermission = (permission: Permission) => {
    setNewRolePermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-orange-100 text-orange-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 ${isOpen ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto ml-auto mr-4 mt-4 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">RBAC Management</h1>
                <p className="text-green-100">Role-Based Access Control</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-green-700"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="assign">Assign Roles</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            {/* Roles Tab */}
            <TabsContent value="roles" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCreateRoleDialog(true)}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Custom Role
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {allRoles.map((role, i) => (
                  <Card key={i} className="bg-gray-800 border-gray-700 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                        <Badge className={getRoleColor(role.name)}>
                          Level {role.hierarchyLevel}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400 mb-2">Permissions ({role.permissions?.length || 0}):</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions?.slice(0, 5).map((perm, j) => (
                            <Badge
                              key={j}
                              variant="outline"
                              className="border-gray-600 text-gray-300"
                            >
                              {perm}
                            </Badge>
                          ))}
                          {(role.permissions?.length || 0) > 5 && (
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              +{(role.permissions?.length || 0) - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {role.description && (
                        <p className="text-sm text-gray-400">{role.description}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Assign Roles Tab */}
            <TabsContent value="assign" className="mt-4 space-y-4">
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Assign Role to User</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">User ID</label>
                    <Input
                      placeholder="Enter user ID or email"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Select Role</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Choose a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {allRoles.map((role) => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.name} (Level {role.hierarchyLevel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleAssignRole}
                    disabled={!selectedUser || !selectedRole}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Assign Role
                  </Button>
                </div>
              </Card>

              {/* Recent Assignments */}
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Role Assignments</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Use the form above to assign roles. All assignments are tracked in the audit log.
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                  <Card key={group} className="bg-gray-800 border-gray-700 p-4">
                    <h4 className="font-semibold text-white mb-3">{group}</h4>
                    <div className="space-y-2">
                      {permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-gray-600 text-gray-300 text-xs"
                          >
                            {perm}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Custom Role Dialog */}
      <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create Custom Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Define a new role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Role Name</label>
              <Input
                placeholder="e.g., Content Moderator"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-3 block">Select Permissions</label>
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                  <div key={group} className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{group}</p>
                    {permissions.map((perm) => (
                      <div key={perm} className="flex items-center gap-2">
                        <Checkbox
                          checked={newRolePermissions.includes(perm)}
                          onCheckedChange={() => togglePermission(perm)}
                          className="bg-gray-700 border-gray-600"
                        />
                        <label className="text-sm text-gray-300 cursor-pointer">{perm}</label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateCustomRole}
                disabled={!newRoleName || newRolePermissions.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Create Role
              </Button>
              <Button
                onClick={() => setShowCreateRoleDialog(false)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RBACManagementPanel;
