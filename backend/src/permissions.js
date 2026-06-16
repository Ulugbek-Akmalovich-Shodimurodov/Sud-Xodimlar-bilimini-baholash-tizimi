export const PERMISSIONS = Object.freeze({
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',
  ADMINS_MANAGE: 'admins.manage',
  REGIONS_MANAGE: 'regions.manage',
  DISTRICTS_MANAGE: 'districts.manage',
  POSITIONS_MANAGE: 'positions.manage',
  COLLEGES_MANAGE: 'colleges.manage',
  CRITERIA_MANAGE: 'criteria.manage',
  LOGS_VIEW: 'logs.view',
  LOGS_EXPORT: 'logs.export',
});

export const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

const ADMIN_DEFAULT_PERMISSIONS = Object.freeze([
  PERMISSIONS.EMPLOYEES_VIEW,
  PERMISSIONS.EMPLOYEES_CREATE,
  PERMISSIONS.EMPLOYEES_UPDATE,
  PERMISSIONS.EMPLOYEES_DELETE,
]);

export function normalizePermissions(value, role = 'admin') {
  if (role === 'super_admin') return [...ALL_PERMISSIONS];

  const source = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.entries(value).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key)
      : ADMIN_DEFAULT_PERMISSIONS;

  return [...new Set(source.filter((permission) => ALL_PERMISSIONS.includes(permission)))];
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return normalizePermissions(user.permissions, user.role).includes(permission);
}
