import { useEffect, useState } from 'react';
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin, fetchRegions } from '../api.js';

function AdminManager({ user }) {
  const [admins, setAdmins] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'admin', assigned_regions: [] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const normalizeRegions = (value) => (Array.isArray(value) ? value : []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchAdmins().then(setAdmins).catch(console.error);
      fetchRegions().then(setRegions).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 2000);
    return () => clearTimeout(timer);
  }, [message, error]);

  if (!user || user.role !== 'super_admin') {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Super admin huquqiga ega emassiz.</div>;
  }

  const resetForm = () => {
    setEditingAdminId(null);
    setForm({ username: '', password: '', role: 'admin', assigned_regions: [] });
    setSelectedRegionId('');
    setShowPassword(false);
    setError('');
    setMessage('');
  };

  const addRegion = () => {
    const id = Number(selectedRegionId);
    const currentRegions = normalizeRegions(form.assigned_regions);
    if (!id || currentRegions.includes(id)) return;
    setForm((prev) => ({ ...prev, assigned_regions: [...normalizeRegions(prev.assigned_regions), id] }));
    setSelectedRegionId('');
  };

  const removeRegion = (id) => {
    setForm((prev) => ({ ...prev, assigned_regions: normalizeRegions(prev.assigned_regions).filter((regionId) => regionId !== id) }));
  };

  const loadAdminForEdit = (admin) => {
    setEditingAdminId(admin.id);
    setForm({
      username: admin.username,
      password: '',
      role: admin.role,
      assigned_regions: normalizeRegions(admin.assigned_regions),
    });
    setSelectedRegionId('');
    setShowPassword(false);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingAdminId) {
        await updateAdmin(editingAdminId, {
          username: form.username,
          password: form.password,
          role: form.role,
          assigned_regions: form.assigned_regions,
        });
        setMessage('Admin muvaffaqiyatli yangilandi');
      } else {
        await createAdmin({
          username: form.username,
          password: form.password,
          role: form.role,
          assigned_regions: form.assigned_regions,
        });
        setMessage('Admin muvaffaqiyatli yaratildi');
      }

      setAdmins(await fetchAdmins());
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Haqiqatan ham ushbu adminni ochirmoqchimisiz?')) return;
    try {
      await deleteAdmin(id);
      setMessage('Admin ochirildi');
      setAdmins(await fetchAdmins());
      if (editingAdminId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Ochirishda xatolik yuz berdi');
    }
  };

  const regionNames = (assignedRegions) => {
    const names = normalizeRegions(assignedRegions)
      .map((id) => regions.find((region) => region.id === id)?.name)
      .filter(Boolean);
    return names.length ? names.join(', ') : 'Hammasi';
  };

  const roleBadgeClass = (role) =>
    role === 'super_admin'
      ? 'bg-violet-100 text-violet-700'
      : 'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-80 rounded-tl-[120px] bg-indigo-50" />
        <div className="pointer-events-none absolute right-24 top-10 h-16 w-16 rounded-full border-8 border-indigo-100" />
        <div className="pointer-events-none absolute right-36 top-14 grid grid-cols-4 gap-1 opacity-50">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
          ))}
        </div>

        <div className="relative">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.2 0-8 2.1-8 4.8 0 .7.6 1.2 1.3 1.2h13.4c.7 0 1.3-.5 1.3-1.2 0-2.7-3.8-4.8-8-4.8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Adminlarni boshqarish</h1>
              <p className="mt-1 text-lg text-slate-600">Super admin uchun administratorlarni qo'shish, tahrirlash va o'chirish.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-base text-slate-700">Foydalanuvchi nomi</span>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="superadmin"
                  pattern="[A-Za-z0-9_]+"
                  title="Foydalanuvchi nomi faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo'lishi kerak"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-base text-slate-700">Parol</span>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingAdminId ? 'Yangi parol (ixtiyoriy)' : 'Parol kiriting'}
                    className="w-full bg-transparent px-4 py-3 text-lg"
                    required={!editingAdminId}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="px-4 text-slate-500 hover:text-slate-700"
                    aria-label="Parolni korsatish yoki yashirish"
                  >
                    {showPassword ? 'Yop' : 'Kor'}
                  </button>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="space-y-2">
                <span className="text-base text-slate-700">Rol</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-base text-slate-700">Viloyatni bittalab qo'shish</span>
                <select
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg"
                >
                  <option value="">Viloyatni tanlang</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addRegion}
                  className="h-[52px] w-full rounded-2xl bg-[#0d2a7a] px-6 text-lg font-semibold text-white hover:bg-[#123596] md:w-auto"
                >
                  Qo'shish
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {normalizeRegions(form.assigned_regions).length === 0 && (
                <span className="text-base text-slate-500">Hech qanday viloyat tanlanmagan.</span>
              )}
              {normalizeRegions(form.assigned_regions).map((regionId) => {
                const region = regions.find((item) => item.id === regionId);
                return (
                  <button
                    key={regionId}
                    type="button"
                    onClick={() => removeRegion(regionId)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700"
                  >
                    {region?.name || `ID ${regionId}`}
                    <span className="rounded-full bg-blue-200 px-2 text-xs">x</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#173f9f] px-6 text-xl font-semibold text-white hover:bg-[#1e4dbc] md:w-auto md:min-w-[300px]">
                {editingAdminId ? 'Yangilash' : 'Saqlash'}
              </button>
              {editingAdminId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-6 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </form>

          {message && <div className="mt-4 rounded-2xl bg-emerald-100 p-4 text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
              <path d="M16 11c1.66 0 3-1.79 3-4s-1.34-4-3-4-3 1.79-3 4 1.34 4 3 4zM8 11c1.66 0 3-1.79 3-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.52.58-2.82 1.65-3.87C10.38 13.04 9.14 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.12 1.02 1.97 2.38 1.97 3.95v2h7v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Adminlar ro'yxati</h2>
            <p className="mt-1 text-lg text-slate-600">Tizimdagi barcha administratorlar</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-2 py-3 font-medium">№</th>
                <th className="px-2 py-3 font-medium">Foydalanuvchi</th>
                <th className="px-2 py-3 font-medium">Rol</th>
                <th className="px-2 py-3 font-medium">Viloyat</th>
                <th className="px-2 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, index) => {
                const firstLetter = (admin.username || 'A').charAt(0).toUpperCase();
                const palette = ['bg-blue-900', 'bg-emerald-600', 'bg-orange-500', 'bg-purple-600', 'bg-cyan-600'];
                const avatarBg = palette[index % palette.length];

                return (
                  <tr key={admin.id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-slate-100 px-2 text-base font-semibold text-slate-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${avatarBg}`}>
                          {firstLetter}
                        </span>
                        <div>
                          <div className="text-2xl font-medium leading-tight text-slate-900">{admin.username}</div>
                          <span className="mt-1 inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                            {regionNames(admin.assigned_regions)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex rounded-xl px-3 py-1.5 text-base font-medium ${roleBadgeClass(admin.role)}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-lg text-slate-700">{regionNames(admin.assigned_regions)}</td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => loadAdminForEdit(admin)}
                          aria-label="Tahrirlash"
                          className="rounded-full border border-slate-300 bg-slate-100 p-3 text-slate-700 hover:bg-slate-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                          </svg>
                        </button>
                        {admin.id !== user?.id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(admin.id)}
                            aria-label="Ochirish"
                            className="rounded-full bg-red-100 p-3 text-red-600 hover:bg-red-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                              <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminManager;
