import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Dashboard', description: 'Bosh sahifa', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/employees', label: 'Xodimlar', description: 'Xodimlarni boshqarish', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/regions', label: 'Viloyatlar', description: 'Hududlarni boshqarish', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
  { to: '/admin/districts', label: 'Tumanlar', description: 'Tumanlarni boshqarish', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z' },
  { to: '/admin/positions', label: 'Lavozimlar', description: 'Lavozimlarni boshqarish', icon: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z' },
  { to: '/admin/criteria', label: 'Kriteriyalar', description: 'Baholash mezonlarini boshqarish', icon: 'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z' },
  { to: '/admin/admins', label: 'Adminlar', description: 'Adminlarni boshqarish', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
  { to: '/admin/logs', label: 'Loglar', description: 'Tizim loglari', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
];

function AdminLayout({ user }) {
  const location = useLocation();

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
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="sticky top-6 self-start rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900">Admin menyu</h2>
        </div>
        <nav className="space-y-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-4 rounded-3xl border p-4 transition hover:border-blue-300 hover:shadow-md ${
                  active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d={item.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="space-y-6">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
