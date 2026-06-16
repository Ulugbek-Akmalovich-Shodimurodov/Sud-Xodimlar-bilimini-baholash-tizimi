import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEmployees, fetchRegions, fetchDistricts, fetchCriteria, fetchColleges } from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';

const scoreRanges = [
  { label: 'Barchasi', min: '', max: '' },
  { label: '0-50', min: 0, max: 50 },
  { label: '51-70', min: 51, max: 70 },
  { label: '71-85', min: 71, max: 85 },
  { label: '86-100', min: 86, max: 100 },
];

function PublicPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedScore, setSelectedScore] = useState(scoreRanges[0]);
  const [employees, setEmployees] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildFilterParams = (extra = {}) => ({
    ...extra,
    search: search || undefined,
    region_id: selectedRegion || undefined,
    district_id: selectedDistrict || undefined,
    college_id: selectedCollege || undefined,
    min_score: selectedScore?.min === '' ? undefined : selectedScore?.min,
    max_score: selectedScore?.max === '' ? undefined : selectedScore?.max,
  });

  useEffect(() => {
    fetchRegions().then(setRegions).catch(console.error);
    fetchColleges().then(setColleges).catch(console.error);
  }, []);

  useEffect(() => {
    fetchCriteria()
      .then((list) => setCriteria(list || []))
      .catch((err) => {
        console.error('Failed to load criteria, falling back to defaults', err);
        setCriteria([]);
      });
  }, []);

  useEffect(() => {
    const params = buildFilterParams({ page, limit });

    setLoading(true);
    fetchEmployees(params)
      .then((response) => {
        setEmployees(response.data);
        setTotal(response.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, selectedRegion, selectedDistrict, selectedCollege, selectedScore, page, limit]);

  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    fetchDistricts({ region_id: selectedRegion }).then(setDistricts).catch(console.error);
  }, [selectedRegion]);

  const pageCount = Math.ceil(total / limit);

  const handleExportExcel = async () => {
    try {
      setExporting(true);

      const exportLimit = 1000;
      let exportPage = 1;
      let totalItems = 0;
      const allEmployees = [];

      while (true) {
        const response = await fetchEmployees(buildFilterParams({ page: exportPage, limit: exportLimit }));
        const batch = response?.data || [];
        totalItems = Number(response?.total || 0);
        allEmployees.push(...batch);

        if (!batch.length || allEmployees.length >= totalItems) break;
        exportPage += 1;
      }

      if (!allEmployees.length) {
        window.alert('Eksport uchun ma`lumot topilmadi.');
        return;
      }

      const rows = allEmployees.map((employee, index) => {
        const scores = employee.scores || {};
        const base = {
          'T/r': index + 1,
          'F.I.O': employee.full_name,
          'Lavozimi': employee.position,
          'Kollega': employee.college_name || '',
          'Viloyat': employee.region_name,
          'Tuman': employee.district_name,
          'Umumiy natija (%)': employee.score,
        };

        if (criteria.length) {
          criteria.forEach((c) => {
            const score = scores[c.key] || 0;
            base[`${c.label} (%)`] = score;
            base[`${c.label} holati`] = score > 0 ? 'Topshirdi' : 'Topshirmadi';
          });
        }

        return base;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Xodimlar');

      const datePart = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `xodimlar_${datePart}.xlsx`);
    } catch (err) {
      console.error(err);
      window.alert('Excel fayl yaratishda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="animate-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge-soft pulse-soft">Ochiq reyting</span>
            <h1 className="mt-3 text-2xl font-semibold">Xodimlar ro‘yxati</h1>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm text-indigo-700 shadow-sm">
            <span className="font-semibold text-slate-900">{total}</span> ta natija
          </div>
        </div>
        <p className="mt-2 text-indigo-600">Baholash natijalarini filtrlash va qidirish.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="F.I.O bo‘yicha qidiruv"
            className="rounded-2xl p-3 transition focus:-translate-y-0.5 focus:shadow-lg focus:shadow-indigo-100"
          />

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-2xl p-3 transition focus:-translate-y-0.5 focus:shadow-lg focus:shadow-indigo-100"
          >
            <option value="">Hammasi viloyatlar</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-2xl p-3 transition focus:-translate-y-0.5 focus:shadow-lg focus:shadow-indigo-100"
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
            className="rounded-2xl p-3 transition focus:-translate-y-0.5 focus:shadow-lg focus:shadow-indigo-100"
          >
            {scoreRanges.map((range) => (
              <option key={range.label} value={range.label}>{range.label}</option>
            ))}
          </select>

          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="rounded-2xl p-3 transition focus:-translate-y-0.5 focus:shadow-lg focus:shadow-indigo-100"
          >
            <option value="">Hammasi kollegalar</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="w-full rounded-2xl bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-900 hover:shadow-lg hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
          >
            {exporting ? 'Excel tayyorlanmoqda...' : 'Excelga yuklash'}
          </button>
        </div>
      </section>

      <section className="animate-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Natijalar</h2>
          {loading && <span className="badge-soft pulse-soft">Yangilanmoqda</span>}
        </div>
        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="loading-skeleton h-12"
                style={{ animationDelay: `${index * 70}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-indigo-50 text-indigo-600">
                <tr>
                  <th className="px-4 py-3">T/r</th>
                  <th className="px-4 py-3">F.I.O</th>
                  <th className="px-4 py-3">Lavozimi</th>
                  <th className="px-4 py-3">Kollega</th>
                  <th className="px-4 py-3">Viloyat</th>
                  <th className="px-4 py-3">Tuman</th>
                  
                  <th className="px-4 py-3">Umumiy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="animate-row cursor-pointer hover:bg-indigo-50"
                    style={{ animationDelay: `${index * 45}ms` }}
                    onClick={() => navigate(`/employee/${employee.id}`)}
                  >
                    <td className="px-4 py-3">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {(page - 1) * limit + index + 1}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.position}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.college_name || 'Belgilanmagan'}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.region_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.district_name}
                  </Link>
                </td>
                {criteria.length ? (
                  criteria.map((c) => {
                    const score = (employee.scores && employee.scores[c.key]) || 0;
                    return (
                      <td key={c.key} className={`px-4 py-3 text-center ${score > 0 ? scoreColorClass(score) : 'text-slate-400'}`}>
                        <Link to={`/employee/${employee.id}`} className="block">
                          {score > 0 ? `${score}%` : 'Topshirmadi'}
                        </Link>
                      </td>
                    );
                  })
                ) : null}
                <td className={`px-4 py-3 text-center ${scoreColorClass(employee.score)}`}>
                  <Link to={`/employee/${employee.id}`} className="block">
                    {employee.score}%
                  </Link>
                </td>
              </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-sm text-indigo-600">
          <div>Jami: {total} xodim</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-xl border border-indigo-200 bg-white px-4 py-2 transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >Oldingi</button>
            <span>{page}/{pageCount || 1}</span>
            <button
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
              className="rounded-xl border border-indigo-200 bg-white px-4 py-2 transition hover:-translate-y-0.5 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >Keyingi</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicPage;

