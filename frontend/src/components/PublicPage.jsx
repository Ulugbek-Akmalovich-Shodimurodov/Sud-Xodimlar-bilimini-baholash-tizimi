import { useEffect, useState } from 'react';
import { fetchEmployees, fetchRegions, fetchDistricts } from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';

const scoreRanges = [
  { label: 'Barchasi', min: '', max: '' },
  { label: '0-50', min: 0, max: 50 },
  { label: '51-70', min: 51, max: 70 },
  { label: '71-85', min: 71, max: 85 },
  { label: '86-100', min: 86, max: 100 },
];

function PublicPage() {
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedScore, setSelectedScore] = useState(scoreRanges[0]);
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    const params = {
      page,
      limit,
      search: search || undefined,
      region_id: selectedRegion || undefined,
      district_id: selectedDistrict || undefined,
      min_score: selectedScore?.min || undefined,
      max_score: selectedScore?.max || undefined,
    };

    setLoading(true);
    fetchEmployees(params)
      .then((response) => {
        setEmployees(response.data);
        setTotal(response.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, selectedRegion, selectedDistrict, selectedScore, page, limit]);

  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    fetchDistricts({ region_id: selectedRegion }).then(setDistricts).catch(console.error);
  }, [selectedRegion]);

  const pageCount = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Xodimlar ro‘yxati</h1>
        <p className="mt-2 text-slate-600">Baholash natijalarini filtrlash va qidirish.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="F.I.O bo‘yicha qidiruv"
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          />

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <option value="">Hammasi viloyatlar</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            disabled={!districts.length}
          >
            <option value="">Hammasi tumanlar</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>{district.name}</option>
            ))}
          </select>

          <select
            value={selectedScore.label}
            onChange={(e) => setSelectedScore(scoreRanges.find((range) => range.label === e.target.value))}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            {scoreRanges.map((range) => (
              <option key={range.label} value={range.label}>{range.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Natijalar</h2>
        {loading ? (
          <div className="mt-6 text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">T/r</th>
                  <th className="px-4 py-3">F.I.O</th>
                  <th className="px-4 py-3">Lavozimi</th>
                  <th className="px-4 py-3">Viloyat</th>
                  <th className="px-4 py-3">Tuman</th>
                  <th className="px-4 py-3">Natija (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((employee, index) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.full_name}</td>
                    <td className="px-4 py-3">{employee.position}</td>
                    <td className="px-4 py-3">{employee.region_name}</td>
                    <td className="px-4 py-3">{employee.district_name}</td>
                    <td className={`px-4 py-3 ${scoreColorClass(employee.score)}`}>{employee.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <div>Jami: {total} xodim</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >Oldingi</button>
            <span>{page}/{pageCount || 1}</span>
            <button
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >Keyingi</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicPage;
