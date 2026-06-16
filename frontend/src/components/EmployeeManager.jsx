import { useEffect, useMemo, useState } from 'react';
import {
  fetchEmployees,
  fetchRegions,
  fetchDistricts,
  fetchPositions,
  fetchCriteria,
  fetchColleges,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';

const emptyForm = {
  full_name: '',
  position: '',
  college_id: '',
  region_id: '',
  district_id: '',
  scores: {},
  chosen_sections: {},
};

function EmployeeManager({ user }) {
  const [employees, setEmployees] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const distributeWeights = (count) => {
    if (!count || count <= 0) return [];
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
  };

  useEffect(() => {
    fetchRegions().then(setRegions).catch(console.error);
    fetchPositions().then(setPositions).catch(console.error);
    fetchCriteria().then(setCriteria).catch(console.error);
    fetchColleges().then(setColleges).catch(console.error);
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
      college_id: selectedCollege || undefined,
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
  }, [page, selectedRegion, selectedDistrict, selectedCollege, search]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 2000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, selectedRegion, selectedDistrict, selectedCollege, search]);

  const activeCriteria = useMemo(() => {
    const collegeId = Number(formState.college_id);
    if (!collegeId) return [];
    const college = colleges.find((item) => Number(item.id) === collegeId);
    const allowedIds = new Set((college?.criteria_ids || []).map((id) => Number(id)));
    return criteria.filter((criterion) => allowedIds.has(Number(criterion.id)));
  }, [criteria, colleges, formState.college_id]);

  const handleOpenModal = (employee = null) => {
    if (employee) {
      const scoresFromEmployee = employee.scores && typeof employee.scores === 'object'
        ? employee.scores
        : {};
      const chosenSectionsFromEmployee = employee.chosen_sections && typeof employee.chosen_sections === 'object'
        ? Object.fromEntries(
          Object.entries(employee.chosen_sections).map(([key, value]) => [
            key,
            Array.isArray(value) ? value : value ? [value] : [],
          ])
        )
        : {};

      setEditing(employee);
      setFormState({
        full_name: employee.full_name,
        position: employee.position,
        college_id: employee.college_id || '',
        region_id: employee.region_id,
        district_id: employee.district_id,
        scores: scoresFromEmployee,
        chosen_sections: chosenSectionsFromEmployee,
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
      if (!formState.college_id) {
        setError('Xodim uchun kollega tanlang');
        return;
      }

      const cleanedChosenSections = Object.entries(formState.chosen_sections || {}).reduce((acc, [key, value]) => {
        const values = Array.isArray(value)
          ? value.filter(Boolean)
          : value ? [value] : [];
        if (values.length) acc[key] = values;
        return acc;
      }, {});

      const payload = {
        full_name: formState.full_name,
        position: formState.position,
        college_id: Number(formState.college_id),
        region_id: Number(formState.region_id),
        district_id: Number(formState.district_id),
        scores: Object.fromEntries(
          Object.entries(formState.scores || {}).map(([key, value]) => [key, value === '' ? 0 : Number(value)])
        ),
        chosen_sections: cleanedChosenSections,
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
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    fetchData();
  };

  const sortedEmployees = useMemo(() => [...employees].sort((a, b) => b.score - a.score), [employees]);

  const toggleSelectAll = () => {
    if (sortedEmployees.length === 0) return;
    if (selectedIds.length === sortedEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedEmployees.map((employee) => employee.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`${selectedIds.length} ta xodimni o'chirishni xohlaysizmi?`)) return;
    for (const id of selectedIds) {
      await deleteEmployee(id);
    }
    setSelectedIds([]);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Xodimlarni boshqarish</h1>
            <p className="mt-2 text-indigo-600">Hududingiz bo'yicha xodimlar ma'lumotlarini boshqarish.</p>
          </div>
          <button onClick={() => handleOpenModal()} className="rounded-2xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-900">Yangi xodim</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidiruv..."
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          >
            <option value="">Viloyat bo'yicha filtr</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          >
            <option value="">Tuman bo'yicha filtr</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          >
            <option value="">Kollega bo'yicha filtr</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-3 text-indigo-700">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === sortedEmployees.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-indigo-200 text-slate-900"
            />
            Barchasini tanlash
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {selectedIds.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-600">
                {selectedIds.length} ta tanlangan
              </span>
            )}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={!selectedIds.length}
              className="rounded-2xl bg-indigo-700 px-4 py-3 text-white hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tanlanganlarni o'chirish
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-indigo-50 text-indigo-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === sortedEmployees.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                  />
                </th>
                <th className="px-4 py-3">T/r</th>
                <th className="px-4 py-3">F.I.O</th>
                <th className="px-4 py-3">Lavozimi</th>
                <th className="px-4 py-3">Kollega</th>
                <th className="px-4 py-3">Viloyat</th>
                <th className="px-4 py-3">Tuman</th>
                <th className="px-4 py-3">Natija</th>
                <th className="px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedEmployees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-indigo-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(employee.id)}
                      onChange={() => toggleSelect(employee.id)}
                      className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                    />
                  </td>
                  <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>
                  <td className="px-4 py-3">{employee.full_name}</td>
                  <td className="px-4 py-3">{employee.position}</td>
                  <td className="px-4 py-3">{employee.college_name || 'Belgilanmagan'}</td>
                  <td className="px-4 py-3">{employee.region_name}</td>
                  <td className="px-4 py-3">{employee.district_name}</td>
                  <td className={`px-4 py-3 ${scoreColorClass(employee.score)}`}>{employee.score}%</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex min-w-[72px] items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(employee)}
                        aria-label="Tahrirlash"
                        className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        aria-label="O'chirish"
                        className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"
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

        <div className="mt-4 flex items-center justify-between text-sm text-indigo-600">
          <div>Jami: {total} xodim</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl border border-indigo-200 bg-white px-4 py-2 disabled:opacity-50">Oldingi</button>
            <span>{page}</span>
            <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)} className="rounded-xl border border-indigo-200 bg-white px-4 py-2 disabled:opacity-50">Keyingi</button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-indigo-900/50 p-4 py-8">
          <div className="w-full max-w-[95vw] overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-indigo-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{editing ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}</h2>
                <p className="mt-1 text-sm text-indigo-500">Kriteriyalar soni ko‘p bo‘lsa ham qulay tarzda to‘ldiring.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-600 transition hover:bg-indigo-100">Bekor qilish</button>
            </div>

            <div className="max-h-[82vh] overflow-hidden">
              <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_1.5fr]">
                <div className="space-y-4 rounded-[28px] border border-indigo-100 bg-indigo-50 p-5">
                  <div className="rounded-3xl bg-gradient-to-r from-[#ffffff] via-[#e7f0ff] to-[#f4f7ff] p-5 shadow-sm">
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-900">Xodim ma'lumotlari</div>
                    <p className="mt-2 text-sm text-indigo-600">F.I.O va joylashuv ma'lumotlarini to'ldiring.</p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-700">F.I.O</label>
                      <input
                        value={formState.full_name}
                        onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
                        placeholder="F.I.O"
                        pattern="[A-Za-z'\\- ]+"
                        title="Faqat lotin harflari, boshliq, tire va apostrof"
                        className="w-full rounded-3xl border border-indigo-100 bg-white p-3 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-700">Lavozim</label>
                      <select
                        value={formState.position}
                        onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                        className="w-full rounded-3xl border border-indigo-100 bg-white p-3 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="">Lavozim tanlang</option>
                        {positions.map((position) => (
                          <option key={position.id} value={position.name}>{position.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-700">Kollega</label>
                      <select
                        value={formState.college_id}
                        onChange={(e) => setFormState({
                          ...formState,
                          college_id: e.target.value,
                          scores: {},
                          chosen_sections: {},
                        })}
                        className="w-full rounded-3xl border border-indigo-100 bg-white p-3 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="">Kollega tanlang</option>
                        {colleges.map((college) => (
                          <option key={college.id} value={college.id}>{college.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-700">Viloyat</label>
                      <select
                        value={formState.region_id}
                        onChange={(e) => {
                          setFormState({ ...formState, region_id: e.target.value, district_id: '' });
                          setSelectedRegion(e.target.value);
                        }}
                        className="w-full rounded-3xl border border-indigo-100 bg-white p-3 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="">Viloyat tanlang</option>
                        {regions.map((region) => (<option key={region.id} value={region.id}>{region.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-indigo-700">Tuman</label>
                      <select
                        value={formState.district_id}
                        onChange={(e) => setFormState({ ...formState, district_id: e.target.value })}
                        className="w-full rounded-3xl border border-indigo-100 bg-white p-3 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="">Tuman tanlang</option>
                        {districts.map((district) => (<option key={district.id} value={district.id}>{district.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 overflow-hidden rounded-[28px] border border-indigo-100 bg-white">
                  <div className="flex items-center justify-between border-b border-indigo-100 px-5 py-4 bg-indigo-50">
                    <div>
                      <div className="text-sm font-semibold text-indigo-700">Kriteriyalar</div>
                      <div className="text-xs text-indigo-500">Tanlangan kollega kriteriyalari</div>
                    </div>
                    <div className="rounded-full bg-indigo-700 px-3 py-1 text-sm font-semibold text-white">{activeCriteria.length} ta</div>
                  </div>

                  <div className="max-h-[62vh] overflow-y-auto p-5">
                    {activeCriteria.length ? (
                      <div className="space-y-4">
                        {activeCriteria.map((field) => {
                          const sectionOptions = field.sections || [];
                          const selectedSections = Array.isArray(formState.chosen_sections?.[field.key])
                            ? formState.chosen_sections[field.key]
                            : formState.chosen_sections?.[field.key] ? [formState.chosen_sections[field.key]] : [];
                          if (sectionOptions.length) {
                            const weights = distributeWeights(sectionOptions.length);
                            return (
                              <div key={field.key} className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-semibold text-slate-800">{field.label}</div>
                                    <div className="text-xs text-indigo-500">Bo‘limlardan bir nechta tanlashingiz mumkin</div>
                                  </div>
                                  <div className="rounded-full bg-white px-3 py-1 text-sm text-indigo-600 shadow-sm">{sectionOptions.length} bo‘lim</div>
                                </div>
                                <div className="grid gap-2">
                                  {sectionOptions.map((section, index) => {
                                    const checked = selectedSections.includes(section.key);
                                    return (
                                      <label key={section.key} className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white px-3 py-2 shadow-sm transition hover:border-slate-500/50">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const existing = Array.isArray(formState.chosen_sections?.[field.key])
                                              ? [...formState.chosen_sections[field.key]]
                                              : formState.chosen_sections?.[field.key]
                                                ? [formState.chosen_sections[field.key]]
                                                : [];
                                            const next = e.target.checked
                                              ? [...new Set([...existing, section.key])]
                                              : existing.filter((value) => value !== section.key);
                                            setFormState({
                                              ...formState,
                                              chosen_sections: {
                                                ...(formState.chosen_sections || {}),
                                                [field.key]: next,
                                              },
                                            });
                                          }}
                                          className="h-4 w-4 rounded border-indigo-200 text-slate-900 focus:ring-slate-500"
                                        />
                                        <div className="flex flex-1 flex-col">
                                          <span className="font-medium text-indigo-700">{section.label}</span>
                                          <span className="text-xs text-indigo-500">{weights[index]}%</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          const value = formState.scores?.[field.key] ?? '';
                          return (
                            <div key={field.key} className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                              <label className="mb-2 block text-sm font-medium text-indigo-700">{field.label}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={value}
                                  onChange={(e) => setFormState({
                                    ...formState,
                                    scores: {
                                      ...(formState.scores || {}),
                                      [field.key]: e.target.value,
                                    },
                                  })}
                                  placeholder="Ball kiriting"
                                  className="w-full rounded-3xl border border-indigo-100 bg-white p-3 pr-24 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
                                />
                                {!value && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">Topshirmadi</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center text-indigo-500">
                        {formState.college_id
                          ? 'Bu kollegaga kriteriyalar biriktirilmagan. Kollegalar sahifasidan biriktiring.'
                          : 'Avval xodim ishlaydigan kollegani tanlang.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="border-t border-indigo-100 bg-red-50 p-4 text-red-700">{error}</div>}

            <div className="flex flex-col gap-3 border-t border-indigo-100 bg-white px-6 py-4 sm:flex-row sm:justify-end">
              <button onClick={() => setModalOpen(false)} className="w-full rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-indigo-700 transition hover:bg-indigo-50 sm:w-auto">Bekor qilish</button>
              <button onClick={handleSave} className="w-full rounded-2xl bg-indigo-700 px-5 py-3 text-white transition hover:bg-indigo-900 sm:w-auto">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManager;
