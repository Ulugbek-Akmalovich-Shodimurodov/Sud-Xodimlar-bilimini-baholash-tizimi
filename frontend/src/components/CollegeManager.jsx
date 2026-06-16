import { useEffect, useMemo, useState } from 'react';
import {
  createCollege,
  deleteCollege,
  fetchColleges,
  fetchCriteria,
  updateCollege,
} from '../api.js';

const emptyForm = {
  name: '',
  description: '',
  criteria_ids: [],
};

function CollegeManager({ user }) {
  const [colleges, setColleges] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const criteriaById = useMemo(() => {
    const map = new Map();
    criteria.forEach((criterion) => map.set(Number(criterion.id), criterion));
    return map;
  }, [criteria]);

  const loadData = async () => {
    const [collegeList, criteriaList] = await Promise.all([fetchColleges(), fetchCriteria()]);
    setColleges(collegeList || []);
    setCriteria(criteriaList || []);
  };

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    loadData().catch((err) => setError(err.response?.data?.error || 'Kollegalar yuklanmadi'));
  }, [user]);

  const resetForm = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setMessage('');
    setError('');
  };

  const handleEdit = (college) => {
    setEditingId(college.id);
    setFormState({
      name: college.name || '',
      description: college.description || '',
      criteria_ids: (college.criteria_ids || []).map((id) => Number(id)),
    });
    setMessage('');
    setError('');
  };

  const toggleCriterion = (criterionId) => {
    const id = Number(criterionId);
    setFormState((prev) => ({
      ...prev,
      criteria_ids: prev.criteria_ids.includes(id)
        ? prev.criteria_ids.filter((item) => item !== id)
        : [...prev.criteria_ids, id],
    }));
  };

  const handleSave = async () => {
    try {
      setError('');
      const payload = {
        name: formState.name.trim(),
        description: formState.description.trim(),
        criteria_ids: formState.criteria_ids,
      };

      if (editingId) {
        await updateCollege(editingId, payload);
        setMessage('Kollega yangilandi');
      } else {
        await createCollege(payload);
        setMessage('Kollega qo\'shildi');
      }

      await loadData();
      setEditingId(null);
      setFormState(emptyForm);
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Kollegani o\'chirmoqchimisiz?')) return;
    await deleteCollege(id);
    await loadData();
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
      <section className="animate-card rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="badge-soft pulse-soft">Kollegalar</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Kollegalarni boshqarish</h1>
            <p className="mt-2 text-indigo-600">
              Har bir kollegaga faqat kerakli kriteriyalarni biriktiring.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-indigo-700 transition hover:bg-indigo-50"
          >
            Yangi kollega
          </button>
        </div>

        {message && <div className="mt-4 rounded-2xl bg-emerald-100 p-4 text-emerald-800">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
          <div className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-indigo-700">Kollega nomi</label>
              <input
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Masalan: Fuqarolik kollegiyasi"
                className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-indigo-700">Izoh</label>
              <textarea
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Ixtiyoriy izoh"
                rows={4}
                className="w-full rounded-2xl border border-indigo-100 bg-white px-4 py-3"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl bg-indigo-700 px-5 py-3 text-white transition hover:bg-indigo-900"
              >
                {editingId ? 'Yangilash' : 'Saqlash'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-indigo-700"
              >
                Tozalash
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Kriteriyalarni biriktirish</h2>
                <p className="mt-1 text-sm text-indigo-600">{formState.criteria_ids.length} ta tanlangan</p>
              </div>
              <button
                type="button"
                onClick={() => setFormState({ ...formState, criteria_ids: criteria.map((item) => Number(item.id)) })}
                className="rounded-2xl bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                Barchasi
              </button>
            </div>

            <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {criteria.map((criterion) => (
                <label
                  key={criterion.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3 transition hover:border-indigo-300"
                >
                  <input
                    type="checkbox"
                    checked={formState.criteria_ids.includes(Number(criterion.id))}
                    onChange={() => toggleCriterion(criterion.id)}
                    className="mt-1 h-4 w-4 rounded border-indigo-200 text-indigo-700"
                  />
                  <span>
                    <span className="block font-semibold text-slate-900">{criterion.label}</span>
                    <span className="text-xs text-indigo-600">{criterion.short_label} · {criterion.sections?.length || 0} bo'lim</span>
                  </span>
                </label>
              ))}
              {!criteria.length && (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-500 md:col-span-2">
                  Avval kriteriya qo'shing.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="animate-card rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Kollegalar ro'yxati</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-indigo-50 text-indigo-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Kriteriyalar</th>
                <th className="px-4 py-3">Xodimlar</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {colleges.map((college, index) => (
                <tr key={college.id} className="animate-row hover:bg-indigo-50" style={{ animationDelay: `${index * 45}ms` }}>
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{college.name}</div>
                    {college.description && <div className="mt-1 text-xs text-indigo-600">{college.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-xl flex-wrap gap-2">
                      {(college.criteria_ids || []).map((criterionId) => {
                        const criterion = criteriaById.get(Number(criterionId));
                        return (
                          <span key={criterionId} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                            {criterion?.short_label || criterion?.label || criterionId}
                          </span>
                        );
                      })}
                      {!college.criteria_ids?.length && <span className="text-slate-400">Biriktirilmagan</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{college.employee_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(college)}
                        className="rounded-xl bg-indigo-100 px-3 py-2 text-indigo-700 hover:bg-indigo-200"
                      >
                        Tahrirlash
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(college.id)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!colleges.length && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-indigo-500">
                    Kollegalar hali mavjud emas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default CollegeManager;
