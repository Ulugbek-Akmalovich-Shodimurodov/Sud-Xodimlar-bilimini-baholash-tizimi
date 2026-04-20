import { query } from '../db.js';

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
  try {
    await query(
      `INSERT INTO admin_logs (
        admin_id, admin_username, action, entity_type, entity_id, 
        entity_name, old_data, new_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        adminId,
        adminUsername,
        action,
        entityType,
        entityId,
        entityName,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error - logging shouldn't break the main operation
  }
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
