import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api/profileService';

type ModulePermissionsResult = {
  permissions: string[];
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isLoading: boolean;
};

export const useModulePermissions = (moduleName: string): ModulePermissionsResult => {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const isPlatformAdmin =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));

  const shouldCheck = !!user && !isSuperadmin && !isPlatformAdmin;
  const { data: permissionsData, isLoading } = useQuery(
    'user-permissions',
    () => profileService.getUserPermissions(),
    { enabled: shouldCheck, refetchOnWindowFocus: false }
  );

  if (!shouldCheck) {
    return {
      permissions: ['view', 'add', 'edit', 'delete'],
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      isLoading: false,
    };
  }

  const modulePermissions: string[] = permissionsData?.data?.[moduleName] || [];
  return {
    permissions: modulePermissions,
    canView: modulePermissions.includes('view'),
    canAdd: modulePermissions.includes('add'),
    canEdit: modulePermissions.includes('edit'),
    canDelete: modulePermissions.includes('delete'),
    isLoading,
  };
};

