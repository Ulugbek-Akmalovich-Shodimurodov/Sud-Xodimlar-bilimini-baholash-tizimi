import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => setError(err.response?.data?.error || 'Statistika olishda xatolik'));
  }, []);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 2000);
    return () => clearTimeout(timer);
  }, [error]);

  if (!user) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="mt-4 text-slate-600">Siz tizimga kirmagansiz. Iltimos, kirish sahifasiga oting.</p>
        <Link to="/login" className="mt-6 inline-block rounded-2xl bg-slate-900 px-5 py-3 text-white">Kirish</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">Xodim natijalari va statistikani boshqarish.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/employees" className="rounded-2xl bg-slate-900 px-5 py-3 text-white">Xodimlarni boshqarish</Link>
            {user.role === 'super_admin' && <Link to="/admin/regions" className="rounded-2xl bg-slate-700 px-5 py-3 text-white">Viloyatlar</Link>}
            {user.role === 'super_admin' && <Link to="/admin/districts" className="rounded-2xl bg-slate-700 px-5 py-3 text-white">Tumanlar</Link>}
            {user.role === 'super_admin' && <Link to="/admin/positions" className="rounded-2xl bg-slate-700 px-5 py-3 text-white">Lavozimlar</Link>}
            {user.role === 'super_admin' && <Link to="/admin/admins" className="rounded-2xl bg-slate-700 px-5 py-3 text-white">Adminlar</Link>}
            {user.role === 'super_admin' && <Link to="/admin/logs" className="rounded-2xl bg-red-600 px-5 py-3 text-white">Loglar</Link>}
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-slate-500">Umumiy xodimlar</p>
          <p className="mt-4 text-3xl font-semibold">{stats ? stats.summary.total_employees : '...'}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-slate-500">Ortacha natija</p>
          <p className="mt-4 text-3xl font-semibold">{stats ? `${stats.summary.average_score}%` : '...'}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase text-slate-500">Rol</p>
          <p className="mt-4 text-3xl font-semibold">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Viloyatlar boyicha ortacha natijalar</h2>
          <div className="mt-4 h-80">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.regions} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average_score" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="mt-8 text-slate-500">Yuklanmoqda...</div>}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tumanlar boyicha ortacha natijalar</h2>
          <div className="mt-4 h-80">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.districts} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average_score" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="mt-8 text-slate-500">Yuklanmoqda...</div>}
          </div>
        </div>
      </section>

      <section className={`grid gap-6 ${stats?.top?.worst?.length ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Eng yaxshi natijalar</h2>
          <div className="mt-4 space-y-3">
            {stats?.top?.best?.map((employee, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-medium">{employee.full_name} - {employee.position}</p>
                <p className={`text-sm ${scoreColorClass(employee.score)}`}>Natija: {employee.score}%</p>
              </div>
            ))}
          </div>
        </div>

        {stats?.top?.worst?.length > 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Eng yomon natijalar</h2>
            <div className="mt-4 space-y-3">
              {stats.top.worst.map((employee, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium">{employee.full_name} - {employee.position}</p>
                  <p className={`text-sm ${scoreColorClass(employee.score)}`}>Natija: {employee.score}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
