import { useEffect, useState } from 'react';
import { fetchCriteria, createCriteria, updateCriteria, deleteCriteria } from '../api.js';

const emptyForm = {
  key: '',
  label: '',
  short_label: '',
  sort_order: 0,
};

function CriteriaManager({ user }) {
  const [criteria, setCriteria] = useState([]);
  const [formState, setFormState] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      if (editingId) {
        await updateCriteria(editingId, formState);
        setMessage('Kriteriya yangilandi');
      } else {
        await createCriteria(formState);
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
      <section className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">Kriteriyalarni boshqarish</h1>
            <p className="mt-2 text-slate-600">Bu yerda baholash mezonlarini qo‘shish, tahrirlash va o‘chirish mumkin.</p>
          </div>
        </div>

        {message && <div className="mt-4 rounded-2xl bg-emerald-100 p-4 text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-rose-100 p-4 text-rose-700">{error}</div>}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            value={formState.key}
            onChange={(e) => setFormState({ ...formState, key: e.target.value })}
            placeholder="Kriteriya kalit nomi"
            className="rounded-2xl p-3"
          />
          <input
            value={formState.label}
            onChange={(e) => setFormState({ ...formState, label: e.target.value })}
            placeholder="To‘liq nom"
            className="rounded-2xl p-3"
          />
          <input
            value={formState.short_label}
            onChange={(e) => setFormState({ ...formState, short_label: e.target.value })}
            placeholder="Qisqa nom"
            className="rounded-2xl p-3"
          />
          <input
            type="number"
            min="0"
            value={formState.sort_order}
            onChange={(e) => setFormState({ ...formState, sort_order: Number(e.target.value) })}
            placeholder="Tartib raqami"
            className="rounded-2xl p-3"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} className="rounded-2xl bg-[#173f9f] px-5 py-3 text-white hover:bg-[#1f4ebf]">
            {editingId ? 'Yangilash' : 'Saqlash'}
          </button>
          <button onClick={resetForm} className="rounded-2xl border border-slate-300 bg-white px-5 py-3">
            Tozalash
          </button>
        </div>
      </section>

      <section className="p-6">
        <h2 className="text-2xl font-semibold">Kriteriyalar ro‘yxati</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
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
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.key}</td>
                  <td className="px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3">{item.short_label}</td>
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700 hover:bg-slate-200"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-xl bg-rose-100 px-3 py-2 text-rose-700 hover:bg-rose-200"
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
