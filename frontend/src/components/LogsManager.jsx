import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
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
  const [exporting, setExporting] = useState(false);
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

  const buildFilterParams = (extra = {}) => ({
    ...extra,
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    ),
  });

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      const exportLimit = 1000;
      let exportPage = 1;
      let totalItems = 0;
      const allLogs = [];

      while (true) {
        const response = await fetchLogs(buildFilterParams({ page: exportPage, limit: exportLimit }));
        const batch = response?.data || [];
        totalItems = Number(response?.total || 0);
        allLogs.push(...batch);

        if (!batch.length || allLogs.length >= totalItems) break;
        exportPage += 1;
      }

      if (!allLogs.length) {
        window.alert('Eksport uchun log topilmadi.');
        return;
      }

      const rows = allLogs.map((log, index) => ({
        'T/r': index + 1,
        'Sana': formatDate(log.created_at),
        'Admin': log.admin_username || '-',
        'Amal': actionLabels[log.action] || log.action || '-',
        'Obyekt turi': entityTypeLabels[log.entity_type] || log.entity_type || '-',
        'Obyekt nomi': log.entity_name || '-',
        "O'zgarishlar": log.change_description || '-',
        'IP manzil': log.ip_address || '-',
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Loglar');

      const datePart = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `admin_loglar_${datePart}.xlsx`);
    } catch (error) {
      console.error('Failed to export logs:', error);
      window.alert('Excel fayl yaratishda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.total_logs}</div>
            <div className="text-sm text-slate-600">Jami operatsiyalar</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'CREATE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">Yaratish</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'UPDATE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">Tahrirlash</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              {stats.actions.find(a => a.action === 'DELETE')?.count || 0}
            </div>
            <div className="text-sm text-slate-600">O'chirish</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Admin loglari</h1>
        <p className="mt-2 text-slate-600">Barcha admin operatsiyalari tarixi.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="rounded-2xl p-3"
          >
            <option value="">Barcha amallar</option>
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            className="rounded-2xl p-3"
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
            className="rounded-2xl p-3"
          />

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="rounded-2xl p-3"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="rounded-2xl p-3"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="rounded-2xl bg-[#173f9f] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f4ebf] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? 'Excel tayyorlanmoqda...' : 'Loglarni Excelga yuklash'}
          </button>
        </div>
      </section>

      {/* Logs Table */}
      <section className="p-6">
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
