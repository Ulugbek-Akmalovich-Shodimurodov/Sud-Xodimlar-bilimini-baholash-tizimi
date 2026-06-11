import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', description: 'Bosh sahifa', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/employees', label: 'Xodimlar', description: 'Xodimlarni boshqarish', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/regions', label: 'Viloyatlar', description: 'Hududlarni boshqarish', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { to: '/admin/districts', label: 'Tumanlar', description: 'Tumanlarni boshqarish', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z' },
  { to: '/admin/positions', label: 'Lavozimlar', description: 'Lavozimlarni boshqarish', icon: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' },
  { to: '/admin/criteria', label: 'Kriteriyalar', description: 'Kriteriyalarni boshqarish', icon: 'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z' },
  { to: '/admin/admins', label: 'Adminlar', description: 'Adminlarni boshqarish', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/logs', label: 'Loglar', description: 'Tizim loglari', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
];

function AdminLayout({ user }) {
  const location = useLocation();

  if (!user) {
    return (
      <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin panel</h1>
        <p className="mt-4 text-indigo-600">Siz tizimga kirmagansiz. Iltimos, kirish sahifasiga o'ting.</p>
        <Link to="/login" className="mt-6 inline-block rounded-2xl bg-indigo-900 px-5 py-3 text-white hover:bg-indigo-700">
          Kirish
        </Link>
      </div>
    );
  }

  const navAccentStyles = [
    'bg-indigo-100 text-indigo-900',
    'bg-emerald-100 text-emerald-900',
    'bg-cyan-100 text-cyan-900',
    'bg-amber-100 text-amber-900',
    'bg-fuchsia-100 text-fuchsia-900',
    'bg-sky-100 text-sky-900',
    'bg-rose-100 text-rose-900',
    'bg-lime-100 text-lime-900',
  ];

  return (
    <div className="grid gap-6 grid-cols-1 min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 w-full lg:w-auto lg:sticky lg:top-6 self-start rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900">Admin menyu</h2>
        </div>
        <nav className="space-y-3">
          {navItems.map((item, index) => {
            const active = location.pathname === item.to;
            const accent = navAccentStyles[index % navAccentStyles.length];
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex flex-wrap items-center gap-4 rounded-3xl border p-4 transition ${
                  active
                    ? 'border-indigo-900 bg-indigo-900 text-white shadow-lg shadow-indigo-900/10'
                    : 'border-indigo-100 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm'
                } min-w-0`}
              >
                <div
                  className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    active ? 'bg-white/10 text-white' : `${accent} shadow-sm`
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-900'} truncate`}>{item.label}</p>
                  <p className={`${active ? 'text-indigo-200' : 'text-indigo-600'} text-xs break-words`}>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 space-y-6">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;

