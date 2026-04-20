import { useEffect, useState } from 'react';
import { fetchLogs, fetchLogsStats } from '../api.js';

const actionLabels = {
  CREATE: 'Yaratish',
  UPDATE: 'Tahrirlash',
  DELETE: 'O\'chirish',
};

const entityTypeLabels = {
  employee: 'Xodim',
  admin: 'Admin',
  region: 'Viloyat',
  district: 'Tuman',
  position: 'Lavozim',
};

function LogsManager({ user }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    admin_username: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    fetchData();
    fetchStatsData();
  }, [user, page, filters]);

  const fetchData = async () => {
    if (user?.role !== 'super_admin') return;
    
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      };
      const data = await fetchLogs(params);
      setLogs(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsData = async () => {
    if (user?.role !== 'super_admin') return;
    
    try {
      const statsData = await fetchLogsStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch logs stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center text-slate-500">
          Loglarni faqat super admin ko'rishi mumkin
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.total_logs}</div>
            <div className="text-sm text-slate-600">Jami operatsiyalar</div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'CREATE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">Yaratish</div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'UPDATE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">Tahrirlash</div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'DELETE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">O'chirish</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin loglari</h1>
        <p className="mt-2 text-slate-600">Barcha admin operatsiyalari tarixi.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="">Barcha amallar</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="">Barcha obyektlar</option>
            {Object.entries(entityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="text"
            value={filters.admin_username}
            onChange={(e) => handleFilterChange('admin_username', e.target.value)}
            placeholder="Admin username"
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          />

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          />
        </div>
      </section>

      {/* Logs Table */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        {loading ? (
          <div className="text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Sana</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Amal</th>
                  <th className="px-4 py-3">Obyekt</th>
                  <th className="px-4 py-3">Obyekt nomi</th>
                  <th className="px-4 py-3">O'zgarishlar</th>
                  <th className="px-4 py-3">IP manzil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{log.admin_username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getActionBadgeClass(log.action)}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {entityTypeLabels[log.entity_type] || log.entity_type}
                    </td>
                    <td className="px-4 py-3">{log.entity_name || '-'}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-xs text-slate-600" title={log.change_description}>
                        {log.change_description ? (
                          <span className="line-clamp-2">{log.change_description}</span>
                        ) : (
                          <span className="text-slate-400">O'zgarishlar yo'q</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div>Jami: {total} ta log</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Oldingi
            </button>
            <span>{page}/{Math.ceil(total / limit) || 1}</span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Keyingi
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LogsManager;
