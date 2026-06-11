import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import PublicPage from './components/PublicPage.jsx';
import EmployeeProfile from './components/EmployeeProfile.jsx';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminManager from './components/AdminManager.jsx';
import RegionDistrictManager from './components/RegionDistrictManager.jsx';
import EmployeeManager from './components/EmployeeManager.jsx';
import CriteriaManager from './components/CriteriaManager.jsx';
import LogsManager from './components/LogsManager.jsx';
import { getToken, logout } from './api.js';

function App() {
  const [token, setToken] = useState(getToken());
  const [user, setUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('supreme_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (tokenValue, userData) => {
    localStorage.setItem('supreme_token', tokenValue);
    localStorage.setItem('supreme_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
    navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('supreme_token');
    localStorage.removeItem('supreme_user');
    setToken(null);
    setUser(null);
    setProfileMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.username || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-indigo-50 text-slate-900 overflow-x-hidden">
      <header className="border-b border-indigo-100 bg-white">
        <div className="mx-auto w-full max-w-[95vw] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/assets/images/SUD-01.png" alt="Oliy sud logotipi" className="h-16 w-16 object-contain" />
              <div className="min-w-0">
                <Link to="/" className="block text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Oliy sud</Link>
                <p className="text-xs text-indigo-600 sm:text-sm">Xodimlar bilimini baholash tizimi</p>
              </div>
              <div className="hidden md:flex items-center gap-4 ml-6 text-sm text-indigo-700">
                <Link to="/" className="font-medium hover:text-slate-900">Jamoat</Link>
                {token ? <Link to="/admin" className="font-medium hover:text-slate-900">Dashboard</Link> : <Link to="/login" className="font-medium hover:text-slate-900">Kirish</Link>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((s) => !s)}
                className="inline-flex items-center justify-center rounded-md bg-white p-2 text-indigo-700 hover:bg-indigo-50 md:hidden"
                aria-label="Menyu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {token && user && (
                <div className="relative flex-shrink-0 flex items-center gap-3" ref={profileRef}>
                  
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((prev) => !prev)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-slate-900 hover:bg-indigo-200"
                    aria-label="Profil menyusi"
                  >
                    {userInitial}
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 z-50 w-52 rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
  <div className="px-3 py-2 text-sm text-indigo-700">{userName}</div>
  <button
    type="button"
    onClick={handleLogout}
    className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
  >
    Tizimdan chiqish
  </button>
</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav panel */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} mt-3 md:hidden`}>
            <nav className="space-y-2 rounded-2xl border border-indigo-100 bg-white p-4 text-sm text-indigo-700">
              <Link to="/" className="block font-medium hover:text-slate-900">Jamoat</Link>
              {token ? <Link to="/admin" className="block font-medium hover:text-slate-900">Dashboard</Link> : <Link to="/login" className="block font-medium hover:text-slate-900">Kirish</Link>}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[95vw] p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/employee/:id" element={<EmployeeProfile />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/admin" element={<AdminLayout user={user} />}>
            <Route index element={<Dashboard user={user} />} />
            <Route path="employees" element={<EmployeeManager user={user} />} />
            <Route path="regions" element={<RegionDistrictManager view="regions" user={user} />} />
            <Route path="districts" element={<RegionDistrictManager view="districts" user={user} />} />
            <Route path="positions" element={<RegionDistrictManager view="positions" user={user} />} />
            <Route path="admins" element={<AdminManager user={user} />} />
            <Route path="criteria" element={<CriteriaManager user={user} />} />
            <Route path="logs" element={<LogsManager user={user} />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

