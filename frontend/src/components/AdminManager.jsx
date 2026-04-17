import { useEffect, useState } from 'react';
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin, fetchRegions } from '../api.js';

function AdminManager({ user }) {
  const [admins, setAdmins] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [editingAdminId, setEditingAdminId] = useState(null);
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
    if (!window.confirm('Haqiqatan ham ushbu adminni o‘chirmoqchimisiz?')) return;
    try {
      await deleteAdmin(id);
      setMessage('Admin o‘chirildi');
      setAdmins(await fetchAdmins());
      if (editingAdminId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'O‘chirishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Adminlarni boshqarish</h1>
        <p className="mt-2 text-slate-600">Super admin uchun administratorlarni qo‘shish, tahrirlash va o‘chirish.</p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Foydalanuvchi nomi"
            pattern="[A-Za-z0-9_]+"
            title="Foydalanuvchi nomi faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi kerak"
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={editingAdminId ? 'Yangi parol (ixtiyoriy)' : 'Parol'}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-medium text-slate-700">Viloyatni bittalab qo‘shish</label>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 text-sm"
                >
                  <option value="">Viloyatni tanlang</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addRegion}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                >
                  Qo‘shish
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {normalizeRegions(form.assigned_regions).length === 0 && (
                  <span className="text-sm text-slate-500">Hech qanday viloyat tanlanmagan.</span>
                )}
                {normalizeRegions(form.assigned_regions).map((regionId) => {
                  const region = regions.find((item) => item.id === regionId);
                  return (
                    <button
                      key={regionId}
                      type="button"
                      onClick={() => removeRegion(regionId)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      {region?.name || `ID ${regionId}`}
                      <span className="rounded-full bg-slate-300 px-2 text-xs">x</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <button className="rounded-2xl bg-slate-900 px-5 py-3 text-white">
              {editingAdminId ? 'Yangilash' : 'Saqlash'}
            </button>
            {editingAdminId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700"
              >
                Bekor qilish
              </button>
            )}
          </div>
        </form>

        {message && <div className="mt-4 rounded-2xl bg-emerald-100 p-4 text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Adminlar ro‘yxati</h2>
        <div className="mt-4 space-y-3">
          {admins.map((admin, index) => {
            const assignedNames = normalizeRegions(admin.assigned_regions).length
              ? normalizeRegions(admin.assigned_regions)
                  .map((id) => regions.find((region) => region.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')
              : 'Hammasi';

            return (
              <div key={admin.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{index + 1}. {admin.username}</p>
                    <p className="text-sm text-slate-500">{assignedNames}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadAdminForEdit(admin)}
                      aria-label="Tahrirlash"
                      className="rounded-2xl border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                      </svg>
                    </button>
                    {admin.id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(admin.id)}
                        aria-label="O‘chirish"
                        className="rounded-2xl bg-red-600 p-2 text-white hover:bg-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default AdminManager;
