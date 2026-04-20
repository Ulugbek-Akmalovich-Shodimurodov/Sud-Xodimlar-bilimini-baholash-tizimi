import { query } from '../db.js';

// Function to detect specific changes
function detectChanges(oldData, newData) {
  const changes = [];
  
  const fieldLabels = {
    full_name: 'F.I.O',
    position: 'Lavozimi',
    region_id: 'Viloyati',
    district_id: 'Tumani',
    konstitutsiya_score: 'Konstitutsiya natijasi',
    kodeks_score: 'Kodeks natijasi',
    protsessual_kodeks_score: 'Protsessual kodeks natijasi',
    akt_sohasi_score: 'AKT natijasi',
    odob_axloq_score: 'Odob-axloq natijasi',
    konstitutsiya_status: 'Konstitutsiya holati',
    kodeks_status: 'Kodeks holati',
    protsessual_kodeks_status: 'Protsessual kodeks holati',
    akt_sohasi_status: 'AKT holati',
    odob_axloq_status: 'Odob-axloq holati',
    score: 'Umumiy natija'
  };

  if (!oldData || !newData) return changes;

  for (const [key, newValue] of Object.entries(newData)) {
    const oldValue = oldData[key];
    if (oldValue !== newValue) {
      const label = fieldLabels[key] || key;
      
      if (key.includes('_score') && typeof oldValue === 'number' && typeof newValue === 'number') {
        // Handle score changes
        changes.push(`${label}: ${oldValue}% dan ${newValue}% ga o'zgartirildi`);
      } else if (key.includes('_status')) {
        // Handle status changes
        changes.push(`${label}: ${oldValue} dan ${newValue} ga o'zgartirildi`);
      } else if (key === 'region_id' || key === 'district_id') {
        // Handle region/district changes
        changes.push(`${label}: o'zgartirildi`);
      } else {
        // Handle other changes
        changes.push(`${label}: "${oldValue}" dan "${newValue}" ga o'zgartirildi`);
      }
    }
  }

  return changes;
}

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
    let changeDescription = '';
    
    if (action === 'UPDATE' && oldData && newData) {
      const changes = detectChanges(oldData, newData);
      if (changes.length > 0) {
        changeDescription = changes.join('; ');
      } else {
        changeDescription = 'O\'zgarishlar topilmadi';
      }
    } else if (action === 'CREATE') {
      changeDescription = `${entityName} yaratildi`;
    } else if (action === 'DELETE') {
      changeDescription = `${entityName} o\'chirildi`;
    }

    await query(
      `INSERT INTO admin_logs (
        admin_id, admin_username, action, entity_type, entity_id, 
        entity_name, change_description, old_data, new_data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        adminId,
        adminUsername,
        action,
        entityType,
        entityId,
        entityName,
        changeDescription,
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
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
}
