'use client';

import { useAuthStore } from '../stores/authStore';
import type { PermissionCode, SystemRole } from '@kapate/types';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasRole = useAuthStore((state) => state.hasRole);

  const can = (permission: PermissionCode | string) => hasPermission(permission);
  const is = (role: SystemRole | string) => hasRole(role);

  const canAny = (permissions: (PermissionCode | string)[]) => {
    return permissions.some((perm) => hasPermission(perm));
  };

  const canAll = (permissions: (PermissionCode | string)[]) => {
    return permissions.every((perm) => hasPermission(perm));
  };

  return {
    user,
    isAuthenticated,
    can,
    is,
    canAny,
    canAll,
  };
}
