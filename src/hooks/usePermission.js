import useAuthStore from '../store/authStore';

export function usePermission(permission) {
  const permissions = useAuthStore((s) => s.permissions);
  return permissions.includes(permission);
}
