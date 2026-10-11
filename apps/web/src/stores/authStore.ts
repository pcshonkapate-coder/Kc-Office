import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSession, PermissionCode, SystemRole } from '@kapate/types';

interface AuthState {
  accessToken: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  setSession: (data: {
    access_token: string;
    user_id: string;
    email: string;
    full_name: string;
    organization_id: string;
    roles: string[];
    permissions: string[];
  }) => void;
  logout: () => void;
  hasPermission: (permissionCode: PermissionCode | string) => boolean;
  hasRole: (roleSlug: SystemRole | string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setSession: (data) => {
        set({
          accessToken: data.access_token,
          isAuthenticated: true,
          user: {
            userId: data.user_id,
            email: data.email,
            fullName: data.full_name,
            organizationId: data.organization_id,
            roles: data.roles,
            permissions: data.permissions,
          },
        });
      },

      logout: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      hasPermission: (permissionCode: PermissionCode | string) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.roles.includes('super_admin')) return true;
        return state.user.permissions.includes(permissionCode as any);
      },

      hasRole: (roleSlug: SystemRole | string) => {
        const state = get();
        return state.user?.roles.includes(roleSlug as any) ?? false;
      },
    }),
    {
      name: 'kapate_os_auth_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
