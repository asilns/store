"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Store, AlertCircle } from "lucide-react";
import { useTranslations } from "@/lib/i18n/hooks";
import { toast } from "sonner";
import { z } from "zod";
import { StoreUserRole, UserStoreMap } from "@/lib/types";
import { useStoreUsers } from "@/lib/hooks/useStoreUsers";
import { useStore } from "@/lib/hooks/useStore";
import { StoreLoadingWrapper } from "@/components/store/StoreLoadingWrapper";

// Zod schema for validation
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "manager", "staff", "viewer"]),
});

export function UserManagementTable() {
  const { t } = useTranslations();
  
  return (
    <StoreLoadingWrapper>
      <UserManagementContent />
    </StoreLoadingWrapper>
  );
}

function UserManagementContent() {
  const { t } = useTranslations();
  
  // Get store data
  const { currentStore } = useStore();
  
  // Use the hook to fetch and manage store users
  const { users, loading, error, inviteUser, updateUserRole, removeUser } = useStoreUsers(currentStore?.id || null);
  console.log('users', users)
  
  // Local state for modals and forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserStoreMap | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "viewer" as const,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // At this point, currentStore is guaranteed to be non-null due to StoreLoadingWrapper
  if (!currentStore) return null;

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      owner: { variant: "default", label: t("userManagement.roles.owner") },
      admin: { variant: "default", label: t("userManagement.roles.admin") },
      manager: { variant: "secondary", label: t("userManagement.roles.manager") },
      staff: { variant: "outline", label: t("userManagement.roles.staff") },
      viewer: { variant: "outline", label: t("userManagement.roles.viewer") },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const handleAddUser = () => {
    setUserFormData({
      name: "",
      email: "",
      role: "viewer",
    });
    setFormErrors({});
    setIsAddUserOpen(true);
  };

  const handleEditUser = (user: UserStoreMap) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role as any,
    });
    setFormErrors({});
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (user?.role === 'owner') {
      toast.error("Cannot delete the store owner");
      return;
    }
    
    if (confirm(t("userManagement.confirmRemoveUser"))) {
      try {
        await removeUser(userId);
        toast.success(t("userManagement.userRemoved"));
      } catch (error) {
        console.error('Error removing user:', error);
        toast.error("Failed to remove user");
      }
    }
  };

  const validateUserForm = () => {
    try {
      userSchema.parse(userFormData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleUserSubmit = async () => {
    if (!validateUserForm()) return;

    if (editingUser) {
      // Update existing user
      try {
        await updateUserRole(editingUser.user_id, userFormData.role);
        toast.success(t("userManagement.userUpdated"));
        setIsEditUserOpen(false);
      } catch (error) {
        console.error('Error updating user:', error);
        toast.error("Failed to update user");
      }
    } else {
      // Create new user
      try {
        await inviteUser({
          email: userFormData.email,
          name: userFormData.name,
          role: userFormData.role
        });
        toast.success(t("userManagement.userInvited"));
        setIsAddUserOpen(false);
        setUserFormData({ name: "", email: "", role: "viewer" });
      } catch (error) {
        console.error('Error inviting user:', error);
        toast.error("Failed to invite user");
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("userManagement.title")}
          </CardTitle>
          <CardDescription>{t("userManagement.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto mb-2" />
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("userManagement.title")}
          </CardTitle>
          <CardDescription>{t("userManagement.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("userManagement.title")}
        </CardTitle>
        <CardDescription>{t("userManagement.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {t("userManagement.table.description")} {currentStore.name}
          </h3>
          <Button onClick={handleAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            {t("userManagement.addUser")}
          </Button>
        </div>
        
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("userManagement.noUsers")}</p>
            <p className="text-sm">{t("userManagement.noUsersDescription")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.user_id}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getRoleBadge(user.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={user.role === 'owner'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.user_id)}
                          disabled={user.role === 'owner'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add/Edit User Dialog */}
      <Dialog open={isAddUserOpen || isEditUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t("userManagement.editUser") : t("userManagement.addUser")}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? t("updateUserRole") : t("inviteNewUser")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">{t("name")}</Label>
              <Input
                id="userName"
                value={userFormData.name}
                onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userEmail">{t("email")}</Label>
              <Input
                id="userEmail"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userRole">{t("role")}</Label>
              <Select value={userFormData.role} onValueChange={(value: any) => setUserFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className={formErrors.role ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("userManagement.roles.viewer")}</SelectItem>
                  <SelectItem value="staff">{t("userManagement.roles.staff")}</SelectItem>
                  <SelectItem value="manager">{t("userManagement.roles.manager")}</SelectItem>
                  <SelectItem value="admin">{t("userManagement.roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleUserSubmit}>
              {editingUser ? t("update") : t("add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
