export const PERMISSIONS = {
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
};

export const PERMISSION_GROUPS = [
  {
    title: 'Xodimlar',
    items: [
      [PERMISSIONS.EMPLOYEES_VIEW, "Xodimlarni ko'rish"],
      [PERMISSIONS.EMPLOYEES_CREATE, "Xodim qo'shish"],
      [PERMISSIONS.EMPLOYEES_UPDATE, "Xodim ma'lumotlarini o'zgartirish"],
      [PERMISSIONS.EMPLOYEES_DELETE, "Xodim o'chirish"],
    ],
  },
  {
    title: 'Maʼlumotnomalar',
    items: [
      [PERMISSIONS.REGIONS_MANAGE, 'Viloyatlarni boshqarish'],
      [PERMISSIONS.DISTRICTS_MANAGE, 'Tumanlarni boshqarish'],
      [PERMISSIONS.POSITIONS_MANAGE, 'Lavozimlarni boshqarish'],
      [PERMISSIONS.COLLEGES_MANAGE, 'Kollegiyalarni boshqarish'],
      [PERMISSIONS.CRITERIA_MANAGE, 'Kriteriyalarni boshqarish'],
    ],
  },
  {
    title: 'Xavfsizlik',
    items: [
      [PERMISSIONS.ADMINS_MANAGE, 'Adminlarni boshqarish'],
      [PERMISSIONS.LOGS_VIEW, "Loglarni ko'rish"],
      [PERMISSIONS.LOGS_EXPORT, 'Loglarni Excelga chiqarish'],
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.items.map(([key]) => key));

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
