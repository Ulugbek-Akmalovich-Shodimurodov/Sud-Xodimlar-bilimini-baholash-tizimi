import { useEffect, useState } from 'react';
import { fetchCriteria, createCriteria, updateCriteria, deleteCriteria } from '../api.js';

const emptyForm = {
  key: '',
  label: '',
  short_label: '',
  sort_order: 0,
  sections: [],
};

function CriteriaManager({ user }) {
  const [criteria, setCriteria] = useState([]);
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    fetchCriteria().then(setCriteria).catch((err) => setError(err.response?.data?.error || 'Kriteriyalar yuklanmadi'));
  }, [user]);

  const resetForm = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setError('');
    setMessage('');
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormState({
      key: item.key,
      label: item.label,
      short_label: item.short_label,
      sort_order: item.sort_order,
      sections: item.sections || [],
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      const cleanedForm = {
        ...formState,
        sections: (formState.sections || []).filter((section) => section.label && section.label.trim()),
      };

      if (editingId) {
        await updateCriteria(editingId, cleanedForm);
        setMessage('Kriteriya yangilandi');
      } else {
        await createCriteria(cleanedForm);
        setMessage('Kriteriya qo‘shildi');
      }
      setCriteria(await fetchCriteria());
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Kriteriyani o‘chirmoqchimisiz?')) return;
    await deleteCriteria(id);
    setCriteria(await fetchCriteria());
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    resetForm();
  };

  const toggleSelectAll = () => {
    if (criteria.length === 0) return;
    if (selectedIds.length === criteria.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(criteria.map((item) => item.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`${selectedIds.length} ta kriteriyani o'chirishni xohlaysizmi?`)) return;
    for (const id of selectedIds) {
      await deleteCriteria(id);
    }
    setCriteria(await fetchCriteria());
    setSelectedIds([]);
    resetForm();
  };

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        Super admin huquqiga ega emassiz.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Kriteriyalarni boshqarish</h1>
            <p className="mt-2 text-indigo-600">Bu yerda baholash mezonlarini qo‘shish, tahrirlash va o‘chirish mumkin.</p>
          </div>
        </div>

        {message && <div className="mt-4 rounded-2xl bg-indigo-100 p-4 text-slate-900">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-indigo-100 p-4 text-slate-900">{error}</div>}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-3 text-indigo-700">
              <input
                type="checkbox"
                checked={criteria.length > 0 && selectedIds.length === criteria.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-indigo-200 text-slate-900"
              />
              Barchasini tanlash
            </label>
            {selectedIds.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-600">
                {selectedIds.length} ta tanlangan
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={!selectedIds.length}
            className="rounded-2xl bg-indigo-700 px-4 py-3 text-white hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tanlanganlarni o'chirish
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            value={formState.key}
            onChange={(e) => setFormState({ ...formState, key: e.target.value })}
            placeholder="Kriteriya kalit nomi"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
          <input
            value={formState.label}
            onChange={(e) => setFormState({ ...formState, label: e.target.value })}
            placeholder="To‘liq nom"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
          <input
            value={formState.short_label}
            onChange={(e) => setFormState({ ...formState, short_label: e.target.value })}
            placeholder="Qisqa nom"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
          <input
            type="number"
            min="0"
            value={formState.sort_order}
            onChange={(e) => setFormState({ ...formState, sort_order: Number(e.target.value) })}
            placeholder="Tartib raqami"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
        </div>

        <div className="mt-4 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Kriteriya bo‘limlari</h3>
            <button
              type="button"
              onClick={() => setFormState({
                ...formState,
                sections: [...(formState.sections || []), { label: '', sort_order: (formState.sections?.length || 0) }],
              })}
              className="rounded-2xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-900"
            >
              Bo‘lim qo‘shish
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {(formState.sections || []).map((section, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={section.label}
                  onChange={(e) => {
                    const nextSections = [...(formState.sections || [])];
                    nextSections[index] = { ...nextSections[index], label: e.target.value };
                    setFormState({ ...formState, sections: nextSections });
                  }}
                  placeholder="Bo‘lim nomi"
                  className="rounded-2xl p-3"
                />
                <input
                  type="number"
                  min="0"
                  value={section.sort_order}
                  onChange={(e) => {
                    const nextSections = [...(formState.sections || [])];
                    nextSections[index] = { ...nextSections[index], sort_order: Number(e.target.value) };
                    setFormState({ ...formState, sections: nextSections });
                  }}
                  placeholder="Tartib raqami"
                  className="rounded-2xl p-3"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextSections = [...(formState.sections || [])];
                    nextSections.splice(index, 1);
                    setFormState({ ...formState, sections: nextSections });
                  }}
                  className="rounded-2xl bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
                >
                  O‘chirish
                </button>
              </div>
            ))}
            {!formState.sections?.length && (
              <div className="rounded-2xl bg-white p-4 text-indigo-500">Bu kriteriyaga hozircha bo‘lim qo‘shilmagan.</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} className="rounded-2xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-900">
            {editingId ? 'Yangilash' : 'Saqlash'}
          </button>
          <button onClick={resetForm} className="rounded-2xl border border-indigo-200 bg-white px-5 py-3">
            Tozalash
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Kriteriyalar ro‘yxati</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-indigo-50 text-indigo-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={criteria.length > 0 && selectedIds.length === criteria.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                  />
                </th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Kalit</th>
                <th className="px-4 py-3">To‘liq nom</th>
                <th className="px-4 py-3">Qisqa nom</th>
                <th className="px-4 py-3">Tartib</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {criteria.map((item, index) => (
                <tr key={item.id} className="hover:bg-indigo-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                    />
                  </td>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.key}</td>
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3">{item.short_label}</td>
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-xl bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-xl bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200"
                      >
                        O‘chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default CriteriaManager;

