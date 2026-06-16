import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin,
  fetchRegions,
  fetchLogs,
} from '../api.js';

const emptyForm = {
  username: '',
  role: 'admin',
  status: 'active',
  assigned_regions: [],
};

function AdminManager({ user }) {
  const [admins, setAdmins] = useState([]);
  const [regions, setRegions] = useState([]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [createPasswordValue, setCreatePasswordValue] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activityAdmin, setActivityAdmin] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  const normalizeRegions = (value) => (Array.isArray(value) ? value : []);

  const loadData = async () => {
    const [adminList, regionList] = await Promise.all([fetchAdmins(), fetchRegions()]);
    setAdmins(adminList || []);
    setRegions(regionList || []);
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadData().catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (!message && !error) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 2500);
    return () => clearTimeout(timer);
  }, [message, error]);

  const activeSuperAdminCount = useMemo(
    () => admins.filter((admin) => admin.role === 'super_admin' && admin.status === 'active').length,
    [admins]
  );

  const filteredAdmins = useMemo(() => admins.filter((admin) => {
    const matchesSearch = !search || admin.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || admin.role === roleFilter;
    const matchesStatus = !statusFilter || (admin.status || 'active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }), [admins, search, roleFilter, statusFilter]);

  const availableRegions = useMemo(() => {
    const selected = normalizeRegions(form.assigned_regions);
    return regions.filter((region) => (
      !selected.includes(region.id)
      && region.name.toLowerCase().includes(regionSearch.toLowerCase())
    ));
  }, [regions, form.assigned_regions, regionSearch]);

  if (!user || user.role !== 'super_admin') {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Super admin huquqiga ega emassiz.</div>;
  }

  const resetForm = () => {
    setAdminModalOpen(false);
    setEditingAdminId(null);
    setForm(emptyForm);
    setCreatePasswordValue('');
    setShowCreatePassword(false);
    setRegionSearch('');
    setError('');
    setMessage('');
  };

  const regionNames = (assignedRegions, role) => {
    if (role === 'super_admin') return 'Barcha hududlar';
    const names = normalizeRegions(assignedRegions)
      .map((id) => regions.find((region) => region.id === id)?.name)
      .filter(Boolean);
    return names.length ? names.join(', ') : 'Hudud belgilanmagan';
  };

  const loadAdminForEdit = (admin) => {
    setAdminModalOpen(true);
    setEditingAdminId(admin.id);
    setForm({
      username: admin.username,
      role: admin.role,
      status: admin.status || 'active',
      assigned_regions: normalizeRegions(admin.assigned_regions),
    });
    setCreatePasswordValue('');
    setRegionSearch('');
    setMessage('');
    setError('');
  };

  const openCreateModal = () => {
    setEditingAdminId(null);
    setForm(emptyForm);
    setCreatePasswordValue('');
    setShowCreatePassword(false);
    setRegionSearch('');
    setMessage('');
    setError('');
    setAdminModalOpen(true);
  };

  const addRegion = (regionId) => {
    const id = Number(regionId);
    if (!id || form.role === 'super_admin') return;
    setForm((prev) => ({
      ...prev,
      assigned_regions: [...new Set([...normalizeRegions(prev.assigned_regions), id])],
    }));
    setRegionSearch('');
  };

  const addAllRegions = () => {
    if (form.role === 'super_admin') return;
    setForm((prev) => ({ ...prev, assigned_regions: regions.map((region) => region.id) }));
  };

  const removeRegion = (id) => {
    setForm((prev) => ({
      ...prev,
      assigned_regions: normalizeRegions(prev.assigned_regions).filter((regionId) => regionId !== id),
    }));
  };

  const selectedAdmin = admins.find((admin) => admin.id === editingAdminId);

  const willRemoveLastActiveSuperAdmin = (admin, nextRole, nextStatus, deleting = false) => (
    admin?.role === 'super_admin'
    && (admin.status || 'active') === 'active'
    && activeSuperAdminCount <= 1
    && (deleting || nextRole !== 'super_admin' || nextStatus === 'blocked')
  );

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      assigned_regions: role === 'super_admin' ? [] : prev.assigned_regions,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!editingAdminId && createPasswordValue.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    if (form.status === 'blocked' && selectedAdmin?.id === user.id) {
      setError("O'zingizni bloklay olmaysiz");
      return;
    }
    if (willRemoveLastActiveSuperAdmin(selectedAdmin, form.role, form.status)) {
      setError("Oxirgi faol super adminni bloklash yoki oddiy admin qilish mumkin emas");
      return;
    }

    try {
      if (editingAdminId) {
        await updateAdmin(editingAdminId, form);
        setMessage('Admin muvaffaqiyatli yangilandi');
      } else {
        await createAdmin({ ...form, password: createPasswordValue });
        setMessage('Admin muvaffaqiyatli yaratildi');
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordModal) return;
    if (passwordValue.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    try {
      await updateAdminPassword(passwordModal.id, passwordValue);
      setPasswordModal(null);
      setPasswordValue('');
      setShowPassword(false);
      setMessage('Parol muvaffaqiyatli yangilandi');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Parolni yangilashda xatolik yuz berdi');
    }
  };

  const changeStatus = (admin, status) => {
    if (admin.id === user.id && status === 'blocked') {
      setError("O'zingizni bloklay olmaysiz");
      return;
    }
    if (willRemoveLastActiveSuperAdmin(admin, admin.role, status)) {
      setError("Oxirgi faol super adminni bloklash mumkin emas");
      return;
    }

    setConfirmAction({
      title: status === 'blocked' ? 'Adminni bloklash' : 'Adminni faollashtirish',
      message: `${admin.username} statusi "${status === 'blocked' ? 'Bloklangan' : 'Faol'}" holatiga o'tkaziladi.`,
      confirmLabel: status === 'blocked' ? 'Bloklash' : 'Faollashtirish',
      danger: status === 'blocked',
      onConfirm: async () => {
        await updateAdmin(admin.id, {
          username: admin.username,
          role: admin.role,
          status,
          assigned_regions: normalizeRegions(admin.assigned_regions),
        });
        setMessage(status === 'blocked' ? 'Admin bloklandi' : 'Admin faollashtirildi');
        await loadData();
      },
    });
  };

  const handleDelete = (admin) => {
    if (admin.id === user.id) {
      setError("O'zingizni o'chira olmaysiz");
      return;
    }
    if (willRemoveLastActiveSuperAdmin(admin, admin.role, admin.status, true)) {
      setError("Oxirgi faol super adminni o'chirish mumkin emas");
      return;
    }

    setConfirmAction({
      title: 'Adminni o\'chirish',
      message: `${admin.username} butunlay o'chiriladi. Tarix loglarda qoladi, lekin account qayta tiklanmaydi.`,
      confirmLabel: "O'chirish",
      danger: true,
      onConfirm: async () => {
        await deleteAdmin(admin.id);
        setMessage("Admin o'chirildi");
        if (editingAdminId === admin.id) resetForm();
        await loadData();
      },
    });
  };

  const openActivity = async (admin) => {
    setActivityAdmin(admin);
    setActivityLogs([]);
    try {
      const result = await fetchLogs({ admin_username: admin.username, limit: 8 });
      setActivityLogs(result.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Faoliyatni yuklashda xatolik yuz berdi');
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Amalni bajarishda xatolik yuz berdi');
      setConfirmAction(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Hali yo\'q';
    return new Date(value).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    { label: 'Jami adminlar', value: admins.length },
    { label: 'Faol', value: admins.filter((admin) => (admin.status || 'active') === 'active').length },
    { label: 'Bloklangan', value: admins.filter((admin) => admin.status === 'blocked').length },
    { label: 'Super admin', value: admins.filter((admin) => admin.role === 'super_admin').length },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Adminlarni boshqarish</h1>
            <p className="mt-1 text-indigo-600">Accountlar, hududlar, status va xavfsizlik amallarini boshqarish.</p>
          </div>
          <div className="flex flex-col gap-3 xl:items-end">
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-2xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-900"
            >
              Admin yaratish
            </button>
            <div className="grid gap-3 sm:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="text-xs font-medium uppercase text-indigo-500">{item.label}</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-indigo-900/50 p-4 py-8">
          <form onSubmit={handleSubmit} className="w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-indigo-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{editingAdminId ? 'Adminni tahrirlash' : 'Yangi admin'}</h2>
                <p className="mt-1 text-sm text-indigo-600">{editingAdminId ? 'Account sozlamalarini yangilang.' : 'Yangi account yarating.'}</p>
              </div>
              <button type="button" onClick={resetForm} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-600 transition hover:bg-indigo-100">
                Bekor qilish
              </button>
            </div>

            <div className="max-h-[76vh] overflow-y-auto p-6">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-indigo-700">Foydalanuvchi nomi</span>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin_01"
                pattern="[A-Za-z0-9_]+"
                title="Faqat lotin harflari, raqamlar va pastki chiziq"
                className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>

            {!editingAdminId && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-indigo-700">Boshlang'ich parol</span>
                <div className="flex rounded-2xl border border-indigo-100 bg-indigo-50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={createPasswordValue}
                    onChange={(e) => setCreatePasswordValue(e.target.value)}
                    placeholder="Kamida 6 belgi"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                    required
                  />
                  <button type="button" onClick={() => setShowCreatePassword((prev) => !prev)} className="px-4 text-indigo-700">
                    {showCreatePassword ? 'Yashirish' : "Ko'rsatish"}
                  </button>
                </div>
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-indigo-700">Rol</span>
                <select
                  value={form.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-indigo-700">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-500"
                >
                  <option value="active">Faol</option>
                  <option value="blocked">Bloklangan</option>
                </select>
              </label>
            </div>

            <div className={form.role === 'super_admin' ? 'opacity-60' : ''}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-indigo-700">Hududlar</span>
                <button type="button" onClick={addAllRegions} disabled={form.role === 'super_admin'} className="text-sm text-indigo-700 hover:text-indigo-900 disabled:cursor-not-allowed">
                  Barchasini tanlash
                </button>
              </div>
              <input
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                disabled={form.role === 'super_admin'}
                placeholder={form.role === 'super_admin' ? 'Super admin barcha hududlarni ko\'radi' : 'Hudud qidirish...'}
                className="w-full rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 outline-none focus:border-indigo-500 disabled:cursor-not-allowed"
              />
              {form.role !== 'super_admin' && regionSearch && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-2xl border border-indigo-100 bg-white p-2 shadow-sm">
                  {availableRegions.slice(0, 8).map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => addRegion(region.id)}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-800 hover:bg-indigo-50"
                    >
                      {region.name}
                    </button>
                  ))}
                  {!availableRegions.length && <div className="px-3 py-2 text-sm text-slate-400">Topilmadi</div>}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {form.role === 'super_admin' && (
                  <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm text-indigo-700">Barcha hududlar</span>
                )}
                {form.role !== 'super_admin' && normalizeRegions(form.assigned_regions).map((regionId) => {
                  const region = regions.find((item) => item.id === regionId);
                  return (
                    <button
                      key={regionId}
                      type="button"
                      onClick={() => removeRegion(regionId)}
                      className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-200"
                    >
                      {region?.name || `ID ${regionId}`} x
                    </button>
                  );
                })}
                {form.role !== 'super_admin' && !normalizeRegions(form.assigned_regions).length && (
                  <span className="text-sm text-slate-400">Hudud tanlanmagan</span>
                )}
              </div>
            </div>

            <button className="w-full rounded-2xl bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-900">
              {editingAdminId ? 'Yangilash' : 'Admin yaratish'}
            </button>
          </div>

          {message && <div className="mt-4 rounded-2xl bg-indigo-100 p-3 text-sm text-slate-900">{message}</div>}
          {error && <div className="mt-4 rounded-2xl bg-red-100 p-3 text-sm text-red-700">{error}</div>}
            </div>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Admin qidirish..."
              className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 outline-none">
              <option value="">Barcha rollar</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 outline-none">
              <option value="">Barcha statuslar</option>
              <option value="active">Faol</option>
              <option value="blocked">Bloklangan</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-indigo-100 text-indigo-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Admin</th>
                  <th className="px-3 py-3 font-medium">Rol</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Hududlar</th>
                  <th className="px-3 py-3 font-medium">Oxirgi kirish</th>
                  <th className="px-3 py-3 text-right font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => {
                  const isCurrentUser = admin.id === user.id;
                  return (
                    <tr key={admin.id} className="hover:bg-indigo-50/60">
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 font-semibold text-white">
                            {(admin.username || 'A').charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{admin.username}</div>
                            <div className="text-xs text-slate-500">ID {admin.id} {isCurrentUser ? '- siz' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(admin.status || 'active') === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {(admin.status || 'active') === 'active' ? 'Faol' : 'Bloklangan'}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-3 py-4 text-slate-700">
                        <div className="truncate" title={regionNames(admin.assigned_regions, admin.role)}>
                          {regionNames(admin.assigned_regions, admin.role)}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(admin.last_login_at)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => loadAdminForEdit(admin)} className="rounded-xl bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200">
                            Tahrirlash
                          </button>
                          <button type="button" onClick={() => { setPasswordModal(admin); setPasswordValue(''); }} className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">
                            Parol
                          </button>
                          <button type="button" onClick={() => openActivity(admin)} className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200">
                            Faoliyat
                          </button>
                          {(admin.status || 'active') === 'active' ? (
                            <button type="button" onClick={() => changeStatus(admin, 'blocked')} className="rounded-xl bg-amber-100 px-3 py-2 text-amber-700 hover:bg-amber-200">
                              Bloklash
                            </button>
                          ) : (
                            <button type="button" onClick={() => changeStatus(admin, 'active')} className="rounded-xl bg-emerald-100 px-3 py-2 text-emerald-700 hover:bg-emerald-200">
                              Faollashtirish
                            </button>
                          )}
                          {!isCurrentUser && (
                            <button type="button" onClick={() => handleDelete(admin)} className="rounded-xl bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200">
                              O'chirish
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

          {!filteredAdmins.length && (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-500">
              Admin topilmadi
            </div>
          )}
      </section>

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Parolni almashtirish</h3>
            <p className="mt-1 text-sm text-indigo-600">{passwordModal.username}</p>
            <div className="mt-5 flex rounded-2xl border border-indigo-100 bg-indigo-50 focus-within:border-indigo-500">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder="Yangi parol"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
              />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="px-4 text-indigo-700">
                {showPassword ? 'Yashirish' : "Ko'rsatish"}
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordModal(null)} className="rounded-xl border border-indigo-100 px-4 py-2 text-indigo-700 hover:bg-indigo-50">
                Bekor qilish
              </button>
              <button type="button" onClick={handlePasswordSave} className="rounded-xl bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-900">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {activityAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end bg-indigo-900/50">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Admin faoliyati</h3>
                <p className="mt-1 text-sm text-indigo-600">{activityAdmin.username}</p>
              </div>
              <button type="button" onClick={() => setActivityAdmin(null)} className="rounded-xl border border-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-50">
                Yopish
              </button>
            </div>
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">{log.action}</span>
                    <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                  </div>
                  <div className="mt-2 font-medium text-slate-900">{log.entity_name || log.entity_type}</div>
                  <div className="mt-1 text-sm text-slate-600">{log.change_description || "O'zgarish qayd etilgan"}</div>
                </div>
              ))}
              {!activityLogs.length && (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-500">
                  Faoliyat yozuvlari topilmadi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">{confirmAction.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{confirmAction.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl border border-indigo-100 px-4 py-2 text-indigo-700 hover:bg-indigo-50">
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={runConfirmAction}
                className={`rounded-xl px-4 py-2 text-white ${confirmAction.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-700 hover:bg-indigo-900'}`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManager;
