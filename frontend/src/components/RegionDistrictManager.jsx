import { useEffect, useState } from 'react';
import {
  fetchRegions,
  fetchDistricts,
  createRegion,
  createDistrict,
  updateRegion,
  deleteRegion,
  updateDistrict,
  deleteDistrict,
  fetchPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from '../api.js';

function RegionDistrictManager({ view, user }) {
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [positions, setPositions] = useState([]);
  const [name, setName] = useState('');
  const [regionId, setRegionId] = useState('');
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentItems = view === 'regions' ? regions : view === 'districts' ? districts : positions;
  const allSelected = currentItems.length > 0 && selectedIds.length === currentItems.length;

  const loadData = async () => {
    try {
      const regionList = await fetchRegions();
      setRegions(regionList);
      if (view === 'districts') {
        const districtList = await fetchDistricts();
        setDistricts(districtList);
      }
      if (view === 'positions') {
        const positionList = await fetchPositions();
        setPositions(positionList);
      }
    } catch (err) {
      console.error(err);
      setError('Maʼlumotlarni yuklashda xatolik yuz berdi');
    }
  };

  useEffect(() => {
    loadData();
  }, [view]);

  useEffect(() => {
    if (!error && !success) return undefined;
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 2000);
    return () => clearTimeout(timer);
  }, [error, success]);

  useEffect(() => {
    setSelectedIds([]);
  }, [view]);

  if (!user || user.role !== 'super_admin') {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Super admin huquqiga ega emassiz.</div>;
  }

  const resetForm = () => {
    setName('');
    setRegionId('');
    setEditing(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (view === 'regions') {
        if (editing) {
          await updateRegion(editing.id, { name });
          setSuccess('Viloyat muvaffaqiyatli yangilandi');
        } else {
          await createRegion({ name });
          setSuccess('Viloyat muvaffaqiyatli yaratildi');
        }
        setRegions(await fetchRegions());
      } else if (view === 'districts') {
        if (!regionId) {
          throw new Error('Iltimos, viloyat tanlang');
        }
        if (editing) {
          await updateDistrict(editing.id, { name, region_id: Number(regionId) });
          setSuccess('Tuman muvaffaqiyatli yangilandi');
        } else {
          await createDistrict({ name, region_id: Number(regionId) });
          setSuccess('Tuman muvaffaqiyatli yaratildi');
        }
        setDistricts(await fetchDistricts());
      } else {
        if (editing) {
          await updatePosition(editing.id, { name });
          setSuccess('Lavozim muvaffaqiyatli yangilandi');
        } else {
          await createPosition({ name });
          setSuccess('Lavozim muvaffaqiyatli yaratildi');
        }
        setPositions(await fetchPositions());
      }
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Saqlashda xatolik yuz berdi');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setName(item.name);
    if (view === 'districts') {
      setRegionId(String(item.region_id));
    }
    setError('');
    setSuccess('');
  };

  const handleDelete = async (item) => {
    const label = view === 'regions' ? 'Viloyat' : view === 'districts' ? 'Tuman' : 'Lavozim';
    if (!window.confirm(`${label}ni o'chirishni xohlaysizmi?`)) return;
    try {
      if (view === 'regions') {
        await deleteRegion(item.id);
        setRegions(await fetchRegions());
        setSuccess('Viloyat o‘chirildi');
      } else if (view === 'districts') {
        await deleteDistrict(item.id);
        setDistricts(await fetchDistricts());
        setSuccess('Tuman o‘chirildi');
      } else {
        await deletePosition(item.id);
        setPositions(await fetchPositions());
        setSuccess('Lavozim o‘chirildi');
      }
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== item.id));
      if (editing?.id === item.id) resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'O‘chirishda xatolik yuz berdi');
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((item) => item.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    const label = view === 'regions' ? 'Viloyat' : view === 'districts' ? 'Tuman' : 'Lavozim';
    if (!window.confirm(`${selectedIds.length} ta ${label}ni o'chirishni xohlaysizmi?`)) return;
    try {
      for (const id of selectedIds) {
        if (view === 'regions') await deleteRegion(id);
        else if (view === 'districts') await deleteDistrict(id);
        else await deletePosition(id);
      }
      await loadData();
      setSelectedIds([]);
      setSuccess(`${selectedIds.length} ta ${label} o'chirildi`);
    } catch (err) {
      setError(err.response?.data?.error || 'O‘chirishda xatolik yuz berdi');
    }
  };

  const regionName = (regionIdValue) => {
    const region = regions.find((regionItem) => regionItem.id === regionIdValue);
    return region ? region.name : 'Viloyat topilmadi';
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0f2d74]">
              {view === 'regions' ? 'Viloyatlarni boshqarish' : view === 'districts' ? 'Tumanlarni boshqarish' : 'Lavozimlarni boshqarish'}
            </h1>
            <p className="mt-2 text-indigo-600">
              {view === 'regions'
                ? 'Viloyatlarni qo‘shish, tahrirlash va o‘chirish.'
                : view === 'districts'
                ? 'Tumanlarni qo‘shish, tahrirlash va o‘chirish.'
                : 'Lavozimlarni qo‘shish, tahrirlash va o‘chirish.'}
            </p>
          </div>
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-indigo-700">
              Bekor qilish
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={view === 'regions' ? 'Viloyat nomi' : view === 'districts' ? 'Tuman nomi' : 'Lavozim nomi'}
            pattern="[A-Za-z'\\- ]+"
            title="Faqat lotin harflari, bo‘shliq, tire va apostrofdan foydalaning"
            className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20"
          />
          {view === 'districts' && (
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-900 shadow-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-500/20">
              <option value="">Viloyat tanlang</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          )}
          <button className="rounded-2xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-900">
            {editing ? 'Saqlash' : 'Saqlash'}
          </button>
        </form>

        {error && <div className="mt-4 rounded-2xl bg-red-100 p-4 text-red-700">{error}</div>}
        {success && <div className="mt-4 rounded-2xl bg-indigo-100 p-4 text-indigo-700">{success}</div>}
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex items-center gap-3 text-indigo-700">
              <input
                type="checkbox"
                checked={allSelected}
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
        <h2 className="text-lg font-semibold">Ro‘yxat</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {view === 'regions' ? (
            regions.map((region, index) => (
              <div key={region.id} className="rounded-2xl border border-indigo-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(region.id)}
                      onChange={() => toggleSelect(region.id)}
                      className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                    />
                    <p className="font-medium">{index + 1}. {region.name}</p>
                  </label>
                  <div className="inline-flex min-w-[72px] items-center justify-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleEdit(region)}
                      aria-label="Tahrirlash"
                      className="rounded-xl border border-indigo-200 p-2 text-indigo-700 hover:bg-indigo-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(region)}
                      aria-label="O‘chirish"
                      className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : view === 'districts' ? (
            districts.map((district, index) => (
              <div key={district.id} className="rounded-2xl border border-indigo-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(district.id)}
                      onChange={() => toggleSelect(district.id)}
                      className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                    />
                    <div>
                      <p className="font-medium">{index + 1}. {district.name}</p>
                      <p className="text-sm text-indigo-500">Viloyat: {regionName(district.region_id)}</p>
                    </div>
                  </label>
                  <div className="inline-flex min-w-[72px] items-center justify-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleEdit(district)}
                      aria-label="Tahrirlash"
                      className="rounded-xl border border-indigo-200 p-2 text-indigo-700 hover:bg-indigo-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(district)}
                      aria-label="O‘chirish"
                      className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            positions.map((position, index) => (
              <div key={position.id} className="rounded-2xl border border-indigo-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(position.id)}
                      onChange={() => toggleSelect(position.id)}
                      className="h-4 w-4 rounded border-indigo-200 text-slate-900"
                    />
                    <p className="font-medium">{index + 1}. {position.name}</p>
                  </label>
                  <div className="inline-flex min-w-[72px] items-center justify-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleEdit(position)}
                      aria-label="Tahrirlash"
                      className="rounded-xl border border-indigo-200 p-2 text-indigo-700 hover:bg-indigo-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 7.34a1 1 0 000-1.41l-3.34-3.34a1 1 0 00-1.41 0l-2.12 2.12 4.75 4.75 2.12-2.12z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(position)}
                      aria-label="O‘chirish"
                      className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M6 7h12v12H6V7zm2 2v8h8V9H8zm8.5-4h-5l-1-1h-3l-1 1H5.5V7h13V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default RegionDistrictManager;

