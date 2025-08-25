import { useState, useEffect, useCallback } from 'react';
import { UserStoreMap } from '@/lib/types';
import { toast } from 'sonner';

export function useStoreUsers(storeId: string | null) {
  const [users, setUsers] = useState<UserStoreMap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/store/users?storeId=${storeId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Load users when storeId changes
  useEffect(() => {
    if (storeId) {
      fetchUsers();
    }
  }, [storeId, fetchUsers]);

  // API functions
  const inviteUser = async (userData: { email: string; name: string; role: string }): Promise<void> => {
    if (!storeId) throw new Error('No store selected');
    
    const response = await fetch(`/api/store/users?storeId=${storeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to invite user');
    }
    
    // Refresh users list
    await fetchUsers();
  };

  const updateUserRole = async (userId: string, newRole: string): Promise<void> => {
    if (!storeId) throw new Error('No store selected');
    
    const response = await fetch(`/api/store/users?storeId=${storeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user role');
    }
    
    // Refresh users list
    await fetchUsers();
  };

  const removeUser = async (userId: string): Promise<void> => {
    if (!storeId) throw new Error('No store selected');
    
    const response = await fetch(`/api/store/users?storeId=${storeId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove user');
    }
    
    // Refresh users list
    await fetchUsers();
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    inviteUser,
    updateUserRole,
    removeUser
  };
}
