import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import PublicPage from './components/PublicPage.jsx';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminManager from './components/AdminManager.jsx';
import RegionDistrictManager from './components/RegionDistrictManager.jsx';
import EmployeeManager from './components/EmployeeManager.jsx';
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

  return (
    <div className="min-h-screen bg-[#f2f5fc] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/images/SUD-01.png"
              alt="Oliy sud logotipi"
              className="h-16 w-16 object-contain"
            />
            <div>
              <Link to="/" className="block text-2xl font-semibold tracking-tight text-[#0f2d74] sm:text-3xl">Oliy sud</Link>
              <p className="text-sm text-slate-600 sm:text-lg">Xodimlar bilimini baholash tizimi</p>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-700 sm:text-xl">
            <Link to="/" className="font-medium hover:text-slate-900">Jamoat</Link>
            {token ? <Link to="/admin" className="font-medium hover:text-slate-900">Dashboard</Link> : <Link to="/login" className="font-medium hover:text-slate-900">Kirish</Link>}
            {token && user && (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#122f7a] text-lg font-semibold text-white"
                  aria-label="Profil menyusi"
                >
                  {userInitial}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="px-3 py-2 text-sm text-slate-600">{userName}</div>
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
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<PublicPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/admin" element={<Dashboard user={user} />} />
          <Route path="/admin/employees" element={<EmployeeManager user={user} />} />
          <Route path="/admin/regions" element={<RegionDistrictManager view="regions" user={user} />} />
          <Route path="/admin/districts" element={<RegionDistrictManager view="districts" user={user} />} />
          <Route path="/admin/positions" element={<RegionDistrictManager view="positions" user={user} />} />
          <Route path="/admin/admins" element={<AdminManager user={user} />} />
          <Route path="/admin/logs" element={<LogsManager user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
