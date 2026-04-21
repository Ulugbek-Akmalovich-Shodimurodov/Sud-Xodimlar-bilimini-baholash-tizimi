import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStats } from '../api.js';

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

  const avgScore = useMemo(() => {
    if (!stats?.summary?.average_score) return 0;
    return Math.round(Number(stats.summary.average_score));
  }, [stats]);

  const topRegion = useMemo(() => {
    if (!stats?.regions?.length) return null;
    return [...stats.regions].sort((a, b) => Number(b.average_score) - Number(a.average_score))[0];
  }, [stats]);

  const topDistrict = useMemo(() => {
    if (!stats?.districts?.length) return null;
    return [...stats.districts].sort((a, b) => Number(b.average_score) - Number(a.average_score))[0];
  }, [stats]);

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="mt-4 text-slate-600">Siz tizimga kirmagansiz. Iltimos, kirish sahifasiga o'ting.</p>
        <Link to="/login" className="mt-6 inline-block rounded-2xl bg-[#173f9f] px-5 py-3 text-white">
          Kirish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                  <path d="M16 11c1.66 0 3-1.79 3-4s-1.34-4-3-4-3 1.79-3 4 1.34 4 3 4zM8 11c1.66 0 3-1.79 3-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.52.58-2.82 1.65-3.87C10.38 13.04 9.14 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.12 1.02 1.97 2.38 1.97 3.95v2h7v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Umumiy xodimlar</p>
                <p className="mt-1 text-5xl font-semibold text-slate-900">{stats ? stats.summary.total_employees : '...'}</p>
                <p className="mt-1 text-slate-600">Tizimdagi jami xodimlar</p>
              </div>
            </div>
            <div className="hidden text-blue-500 lg:block">
              <svg viewBox="0 0 120 40" className="h-10 w-24" fill="none">
                <path d="M2 22c14-18 24 16 38 0s22-20 36-4 24 4 42-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                  <path d="M4 17l6-6 4 4 6-6v4h2V5h-8v2h4l-4 4-4-4-8 8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">O'rtacha natija</p>
                <p className="mt-1 text-5xl font-semibold text-slate-900">{stats ? `${avgScore}%` : '...'}</p>
                <p className="mt-1 text-slate-600">O'rtacha baholash natijasi</p>
              </div>
            </div>
            <div className="hidden text-emerald-500 lg:block">
              <svg viewBox="0 0 120 40" className="h-10 w-24" fill="none">
                <path d="M2 22c14-18 24 16 38 0s22-20 36-4 24 4 42-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                  <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3zm0 4l-1.2 2.4L8 9l2 1.9-.5 2.8 2.5-1.3 2.5 1.3-.5-2.8 2-1.9-2.8-.6L12 6z" />
                </svg>
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">Rol</p>
                <p className="mt-1 text-5xl font-semibold text-slate-900">{user.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                <p className="mt-1 text-slate-600">Sizning joriy rolingiz</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                  <path d="M5 3h3v18H5V3zm5 6h3v12h-3V9zm5-4h3v16h-3V5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Viloyatlar bo'yicha o'rtacha natijalar</h2>
            </div>
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
              <option>Ustunlik</option>
            </select>
          </div>

          <div className="h-96">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.regions} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${Math.round(Number(value))}%`} />
                  <Bar dataKey="average_score" radius={[8, 8, 0, 0]}>
                    {stats.regions.map((_, idx) => (
                      <Cell key={idx} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mt-8 text-slate-500">Yuklanmoqda...</div>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-base text-blue-700">
            {topRegion
              ? `${topRegion.name} eng yuqori o'rtacha natijaga ega (${Math.round(Number(topRegion.average_score))}%).`
              : 'Ma\'lumot mavjud emas.'}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                  <path d="M5 10h3v11H5V10zm5-7h3v18h-3V3zm5 4h3v14h-3V7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Tumanlar bo'yicha o'rtacha natijalar</h2>
            </div>
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
              <option>Ustunlik</option>
            </select>
          </div>

          <div className="h-96">
            {stats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.districts} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${Math.round(Number(value))}%`} />
                  <Bar dataKey="average_score" radius={[8, 8, 0, 0]}>
                    {stats.districts.map((_, idx) => (
                      <Cell key={idx} fill="#22c55e" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="mt-8 text-slate-500">Yuklanmoqda...</div>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-base text-emerald-700">
            {topDistrict
              ? `${topDistrict.name} eng yuqori natijaga ega (${Math.round(Number(topDistrict.average_score))}%).`
              : 'Ma\'lumot mavjud emas.'}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-20 bottom-0 h-44 w-96 rounded-tl-[120px] bg-blue-100/70" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
                <path d="M11 2v10h10A10 10 0 0011 2zm-1 1.05A10 10 0 1021 13H10V3.05z" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Umumiy tahlil</h3>
              <p className="mt-2 text-lg text-slate-700">
                Tizimdagi o'rtacha natija {avgScore}% ni tashkil etmoqda. {topRegion ? `${topRegion.name} viloyati` : 'Eng yaxshi hudud'} va{' '}
                {topDistrict ? `${topDistrict.name}` : 'yetakchi tuman'} eng yaxshi natijalarni ko'rsatmoqda.
              </p>
            </div>
          </div>
          <div className="hidden text-blue-700 md:block">
            <svg viewBox="0 0 120 80" className="h-20 w-32" fill="none">
              <rect x="4" y="10" width="70" height="50" rx="8" stroke="currentColor" strokeWidth="3" />
              <path d="M12 50h6V32h-6v18zm12 0h6V25h-6v25zm12 0h6V36h-6v14zm12 0h6V20h-6v30z" fill="currentColor" />
              <circle cx="95" cy="55" r="18" stroke="currentColor" strokeWidth="5" />
              <path d="M108 68l10 10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
