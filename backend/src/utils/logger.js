// Temporary disabled logging to isolate deployment issues
export async function logAdminAction({
  adminId,
  adminUsername,
  action,
  entityType,
  entityId,
  entityName,
  oldData,
  newData,
  ipAddress,
  userAgent,
}) {
  // Temporarily disabled to isolate deployment issues
  console.log('Logging disabled temporarily:', {
    adminId,
    adminUsername,
    action,
    entityType,
    entityId,
    entityName,
  });
}

export function getEntityName(entityType, data) {
  switch (entityType) {
    case 'employee':
      return data?.full_name || 'Noma\'lum xodim';
    case 'admin':
      return data?.username || 'Noma\'lum admin';
    case 'region':
      return data?.name || 'Noma\'lum viloyat';
    case 'district':
      return data?.name || 'Noma\'lum tuman';
    case 'position':
      return data?.name || 'Noma\'lum lavozim';
    default:
      return 'Noma\'lum obyekt';
  }
}

export function getClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}
