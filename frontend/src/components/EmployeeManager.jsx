import { useEffect, useMemo, useState } from 'react';
import {
  fetchEmployees,
  fetchRegions,
  fetchDistricts,
  fetchPositions,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';

const examFields = [
  { key: 'konstitutsiya_score', label: 'Konstitutsiya (%)' },
  { key: 'kodeks_score', label: 'Kodeks (%)' },
  { key: 'protsessual_kodeks_score', label: 'Protsessual kodeks (%)' },
  { key: 'akt_sohasi_score', label: 'AKT sohasi (%)' },
  { key: 'odob_axloq_score', label: 'Odob-axloq (%)' },
];

const emptyForm = {
  full_name: '',
  position: '',
  region_id: '',
  district_id: '',
  konstitutsiya_score: '',
  kodeks_score: '',
  protsessual_kodeks_score: '',
  akt_sohasi_score: '',
  odob_axloq_score: '',
};

function EmployeeManager({ user }) {
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegions().then(setRegions).catch(console.error);
    fetchPositions().then(setPositions).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    fetchDistricts({ region_id: selectedRegion }).then(setDistricts).catch(console.error);
  }, [selectedRegion]);

  const fetchData = () => {
    setLoading(true);
    fetchEmployees({
      page,
      limit,
      search: search || undefined,
      region_id: selectedRegion || undefined,
      district_id: selectedDistrict || undefined,
    })
      .then((data) => {
        setEmployees(data.data);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [page, selectedRegion, selectedDistrict, search]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 2000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditing(employee);
      setFormState({
        full_name: employee.full_name,
        position: employee.position,
        region_id: employee.region_id,
        district_id: employee.district_id,
        konstitutsiya_score: employee.konstitutsiya_score > 0 ? String(employee.konstitutsiya_score) : '',
        kodeks_score: employee.kodeks_score > 0 ? String(employee.kodeks_score) : '',
        protsessual_kodeks_score: employee.protsessual_kodeks_score > 0 ? String(employee.protsessual_kodeks_score) : '',
        akt_sohasi_score: employee.akt_sohasi_score > 0 ? String(employee.akt_sohasi_score) : '',
        odob_axloq_score: employee.odob_axloq_score > 0 ? String(employee.odob_axloq_score) : '',
      });
      setSelectedRegion(employee.region_id);
    } else {
      setEditing(null);
      setFormState(emptyForm);
      setSelectedRegion('');
      setSelectedDistrict('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setError('');

      const payload = {
        full_name: formState.full_name,
        position: formState.position,
        region_id: Number(formState.region_id),
        district_id: Number(formState.district_id),
        konstitutsiya_score: formState.konstitutsiya_score === '' ? 0 : Number(formState.konstitutsiya_score),
        kodeks_score: formState.kodeks_score === '' ? 0 : Number(formState.kodeks_score),
        protsessual_kodeks_score: formState.protsessual_kodeks_score === '' ? 0 : Number(formState.protsessual_kodeks_score),
        akt_sohasi_score: formState.akt_sohasi_score === '' ? 0 : Number(formState.akt_sohasi_score),
        odob_axloq_score: formState.odob_axloq_score === '' ? 0 : Number(formState.odob_axloq_score),
      };

      if (editing) {
        await updateEmployee(editing.id, payload);
      } else {
        await createEmployee(payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xodimni o'chirishni xohlaysizmi?")) return;
    await deleteEmployee(id);
    fetchData();
  };

  const sortedEmployees = useMemo(() => [...employees].sort((a, b) => b.score - a.score), [employees]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Xodimlarni boshqarish</h1>
            <p className="mt-2 text-slate-600">Hududingiz bo'yicha xodimlar ma'lumotlarini boshqarish.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="rounded-2xl bg-slate-900 px-5 py-3 text-white">Yangi xodim</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidiruv..."
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="">Viloyat bo'yicha filtr</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="">Tuman bo'yicha filtr</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">T/r</th>
                <th className="px-4 py-3">F.I.O</th>
                <th className="px-4 py-3">Lavozimi</th>
                <th className="px-4 py-3">Viloyat</th>
                <th className="px-4 py-3">Tuman</th>
                <th className="px-4 py-3">Natija</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedEmployees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>
                  <td className="px-4 py-3">{employee.full_name}</td>
                  <td className="px-4 py-3">{employee.position}</td>
                  <td className="px-4 py-3">{employee.region_name}</td>
                  <td className="px-4 py-3">{employee.district_name}</td>
                  <td className={`px-4 py-3 ${scoreColorClass(employee.score)}`}>{employee.score}%</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex min-w-[72px] items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(employee)}
                        aria-label="Tahrirlash"
                        className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        aria-label="O'chirish"
                        className="rounded-xl bg-rose-100 p-2 text-rose-700 hover:bg-rose-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div>Jami: {total} xodim</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:opacity-50">Oldingi</button>
            <span>{page}</span>
            <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:opacity-50">Keyingi</button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editing ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-900">Bekor qilish</button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={formState.full_name}
                onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
                placeholder="F.I.O"
                pattern="[A-Za-z'\\- ]+"
                title="Faqat lotin harflari, boshliq, tire va apostrof"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              />
              <select value={formState.position} onChange={(e) => setFormState({ ...formState, position: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <option value="">Lavozim tanlang</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.name}>{position.name}</option>
                ))}
              </select>
              <select
                value={formState.region_id}
                onChange={(e) => {
                  setFormState({ ...formState, region_id: e.target.value, district_id: '' });
                  setSelectedRegion(e.target.value);
                }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <option value="">Viloyat tanlang</option>
                {regions.map((region) => (<option key={region.id} value={region.id}>{region.name}</option>))}
              </select>
              <select value={formState.district_id} onChange={(e) => setFormState({ ...formState, district_id: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <option value="">Tuman tanlang</option>
                {districts.map((district) => (<option key={district.id} value={district.id}>{district.name}</option>))}
              </select>

              {examFields.map((field) => (
                <input
                  key={field.key}
                  type="number"
                  min="0"
                  max="100"
                  value={formState[field.key]}
                  onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                  placeholder={field.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                />
              ))}
            </div>

            {error && <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-300 bg-white px-5 py-3">Bekor qilish</button>
              <button onClick={handleSave} className="rounded-2xl bg-slate-900 px-5 py-3 text-white">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManager;
