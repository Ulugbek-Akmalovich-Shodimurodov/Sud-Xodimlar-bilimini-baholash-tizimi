import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCriteria, fetchEmployee, fetchEmployees } from '../api.js';
import { scoreColorClass } from '../utils/scoreColor.js';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rank, setRank] = useState(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');

    Promise.all([fetchEmployee(id), fetchCriteria(), fetchEmployees()])
      .then(([employeeData, criteriaData, employeesData]) => {
        setEmployee(employeeData);
        setCriteria(criteriaData || []);
        let all = [];
        if (Array.isArray(employeesData)) {
          all = employeesData;
        } else if (employeesData && Array.isArray(employeesData.data)) {
          all = employeesData.data;
        } else if (employeesData && Array.isArray(employeesData.rows)) {
          all = employeesData.rows;
        } else if (employeesData && Array.isArray(employeesData.employees)) {
          all = employeesData.employees;
        } else {
          all = [];
        }
        setTotalEmployees(all.length || 0);
        const sorted = all.slice().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
        const idx = sorted.findIndex((e) => String(e.id) === String(employeeData.id));
        setRank(idx >= 0 ? idx + 1 : null);
      })
      .catch((err) => {
        console.error(err);
        setError('Xodim ma‘lumotlarini yuklashda xatolik yuz berdi.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm text-indigo-500">Yuklanmoqda...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-indigo-100 p-6 text-slate-900">{error}</div>;
  }

  if (!employee) {
    return <div className="rounded-3xl bg-white p-6 shadow-sm text-indigo-500">Xodim topilmadi.</div>;
  }

  const scoreRows = criteria.map((criterion) => {
    const score = (employee.scores && Number(employee.scores[criterion.key])) || 0;
    return { ...criterion, score };
  });

  const totalCriteria = scoreRows.length;
  const passedCriteria = scoreRows.filter((criterion) => criterion.score > 0).length;
  const missedCriteria = totalCriteria - passedCriteria;
  const selectedSectionsCount = Object.values(employee.chosen_sections || {}).reduce((sum, value) => {
    if (Array.isArray(value)) return sum + value.length;
    if (value) return sum + 1;
    return sum;
  }, 0);

  const unsubmittedSectionGroups = criteria.reduce((acc, criterion) => {
    const sectionOptions = criterion.sections || [];
    if (!sectionOptions.length) return acc;

    const selected = Array.isArray(employee.chosen_sections?.[criterion.key])
      ? employee.chosen_sections[criterion.key]
      : employee.chosen_sections?.[criterion.key]
        ? [employee.chosen_sections[criterion.key]]
        : [];

    const missing = sectionOptions.filter((section) => !selected.includes(section.key));
    if (missing.length) acc[criterion.label] = missing.map((section) => section.label || section.key);
    return acc;
  }, {});

  const unsubmittedSectionsCount = Object.values(unsubmittedSectionGroups).reduce((sum, items) => sum + items.length, 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'Nomaʼlum';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Nomaʼlum';
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const trendData = scoreRows.map((criterion) => ({
    label: criterion.short_label || criterion.label,
    score: criterion.score,
  }));

  const timeSince = (dateString) => {
    if (!dateString) return 'Hech qachon';
    const past = new Date(dateString).getTime();
    if (Number.isNaN(past)) return 'Nomaʼlum';
    let diff = Date.now() - past;
    const msInMinute = 60 * 1000;
    const msInHour = 60 * msInMinute;
    const msInDay = 24 * msInHour;
    const msInMonth = 30 * msInDay;
    const msInYear = 365 * msInDay;
    const years = Math.floor(diff / msInYear);
    diff -= years * msInYear;
    const months = Math.floor(diff / msInMonth);
    diff -= months * msInMonth;
    const days = Math.floor(diff / msInDay);
    diff -= days * msInDay;
    const hours = Math.floor(diff / msInHour);
    const minutes = Math.floor((diff - hours * msInHour) / msInMinute);
    if (years) return `${years} yil ${months} oy oldin`;
    if (months) return `${months} oy ${days} kun oldin`;
    if (days) return `${days} kun oldin`;
    if (hours) return `${hours} soat ${minutes} min oldin`;
    return `${minutes} min oldin`;
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{employee.full_name}</h1>
            <p className="mt-3 text-lg text-indigo-700">{employee.position}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-indigo-700 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-700 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </svg>
                </span>
                {employee.region_name}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-indigo-700 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-700 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h2v2H8v-2zm4 0h2v2h-2v-2zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2z" />
                  </svg>
                </span>
                {employee.district_name}
              </span>
            </div>
          </div>

<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:max-w-5xl">

  {/* Oxirgi imtihon vaqti */}
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM7 10h10v2H7v-2z" />
          </svg>
        </span>

        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Oxirgi imtihon vaqti
        </h3>
      </div>

      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
        So‘nggi
      </span>
    </div>

    <div className="text-sm font-bold leading-tight text-slate-900">
      {formatDate(employee.updated_at)}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Oxirgi marta qachon imtihon topshirgani.
    </p>
  </div>

  {/* Imtihon topshirmaganiga */}
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 8V4l8 8-8 8v-4H4V8z" />
          </svg>
        </span>

        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
          Imtihon topshirmaganiga
        </h3>
      </div>

      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        Vaqt
      </span>
    </div>

    <div className="text-sm font-bold leading-tight text-slate-900">
      {timeSince(employee.updated_at)}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Oxirgi imtihondan beri o‘tgan vaqt.
    </p>
  </div>

  {/* Reyting */}
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
          </svg>
        </span>

        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Umumiy o‘rni
        </h3>
      </div>

      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
        Reyting
      </span>
    </div>

    <div className="text-sm font-bold leading-tight text-slate-900">
      {rank ? `${rank}/${totalEmployees}` : '—'}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Xodim umumiy reytingdagi o‘rni.
    </p>
  </div>

</div>
</div>
</div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">

  {/* Umumiy natija */}
  <div className="rounded-3xl border border-indigo-100 bg-slate-50 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2V17h2v-.5zm0-10h-2v8.5h2V6.5z" />
          </svg>
        </span>
        Umumiy natija
      </div>

      <div className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
        Ball
      </div>
    </div>

    <div className="mt-4 text-base font-bold text-slate-900">
      {employee.score ?? 0}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Xodimning umumiy ball ko‘rsatkichi.
    </p>
  </div>

  {/* Topshirilgan kriteriya */}
  <div className="rounded-3xl border border-indigo-100 bg-slate-50 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h2v2H8v-2zm4 0h2v2h-2v-2zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2z" />
          </svg>
        </span>
        Topshirilgan kriteriya
      </div>

      <div className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
        Kriteriya
      </div>
    </div>

    <div className="mt-4 text-base font-bold text-slate-900">
      {passedCriteria}/{totalCriteria}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Topshirilgan kriteriyalar soni umumiydan.
    </p>
  </div>

  {/* Tanlangan bo‘limlar */}
  <div className="rounded-3xl border border-indigo-100 bg-slate-50 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v2h-2V7zm0 4h2v6h-2v-6z" />
          </svg>
        </span>
        Tanlangan bo‘limlar
      </div>

      <div className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
        Bo‘lim
      </div>
    </div>

    <div className="mt-4 text-base font-bold text-slate-900">
      {selectedSectionsCount}
    </div>

    <p className="mt-2 text-[11px] leading-5 text-slate-500">
      Xodim tomonidan tanlangan bo‘limlar soni.
    </p>
  </div>

</div>

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/50 p-6 shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
  
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              O‘zlashtirish foizining o‘sish grafigi
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Kriteriyalar bo‘yicha o‘zlashtirish foizi vaqt davomida qanday
              o‘zgarib borganini kuzating.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 backdrop-blur-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-600">
              {totalCriteria} ta kriteriya
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-6 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#64748b",
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 12,
                  fill: "#64748b",
                }}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  backgroundColor: "#fff",
                }}
                formatter={(value) => [`${value}%`, "O‘zlashtirish"]}
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#lineGradient)"
                strokeWidth={4}
                dot={{
                  r: 5,
                  strokeWidth: 3,
                  fill: "#fff",
                  stroke: "#6366f1",
                }}
                activeDot={{
                  r: 8,
                  fill: "#6366f1",
                  stroke: "#fff",
                  strokeWidth: 3,
                }}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

<div className="grid gap-6 lg:grid-cols-2">

  {/* TOPSHIRILGAN BO‘LIMLAR */}
  <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 text-emerald-600"
            >
              <path d="M9 16.2l-3.5-3.5L4 14.2l5 5L20 8.2 18.5 6.8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Topshirilgan bo‘limlar
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Har bir kriteriya doirasidagi tanlangan bo‘limlar.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
        Jami bo‘limlar: {selectedSectionsCount}
      </div>
    </div>

    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      {Object.entries(employee.chosen_sections || {}).map(([key, value]) => (
        <div
          key={key}
          className="
            group
            relative
            overflow-hidden
            rounded-3xl
            border
            border-emerald-100
            bg-white
            p-5
            shadow-[0_4px_20px_rgba(15,23,42,0.06)]
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-[0_12px_35px_rgba(15,23,42,0.12)]
          "
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-green-400" />

          <div className="pl-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-emerald-600"
                  >
                    <path d="M10 17l5-5-5-5v10z" />
                  </svg>
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {key}
                </h3>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {Array.isArray(value) ? value.length : 1} ta
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {Array.isArray(value) ? (
                value.map((section) => (
                  <span
                    key={section}
                    className="
                    
                      rounded-lg
                      border
                      border-emerald-200
                      bg-white
                      px-2
                      py-0
                      text-sm
                      font-medium
                      text-emerald-700
                      shadow-sm

                    "
                  >
                    {section}
                  </span>
                ))
              ) : (
                <span
                  className="
                    rounded-full
                    border
                    border-emerald-200
                    bg-white
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-emerald-700
                    shadow-sm
                  "
                >
                  {value}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>

  {/* TOPSHIRMAGAN BO‘LIMLAR */}
  <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className="h-6 w-6 text-red-600"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 6L18 18M18 6L6 18"
    /></svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Topshirmagan bo‘limlar
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Har bir kriteriyada tanlanmagan bo‘limlar.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-700">
        Jami bo‘limlar: {unsubmittedSectionsCount}
      </div>
    </div>

    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      {Object.entries(unsubmittedSectionGroups).length ? (
        Object.entries(unsubmittedSectionGroups).map(([key, value]) => (
          <div
            key={key}
            className="
              group
              relative
              overflow-hidden
              rounded-3xl
              border
              border-red-100
              bg-white
              p-5
              shadow-[0_4px_20px_rgba(15,23,42,0.06)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-[0_12px_35px_rgba(15,23,42,0.12)]
            "
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-rose-400" />

            <div className="pl-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6 text-red-600"
                    >
                      <path d="M12 2L1 21h22L12 2zm0 5l1 8h-2l1-8zm0 11a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {key}
                  </h3>
                </div>

                <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                  {value.length} ta
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {value.map((section) => (
                  <span
  key={section}
  className="
    rounded-lg
    border
    border-red-200
    bg-red-50
    px-2
    py-0
    text-sm
    font-medium
    text-red-700
    shadow-sm
  "
>
  {section}
</span>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="text-4xl">🎉</div>

          <div className="mt-3 text-lg font-semibold text-slate-700">
            Ajoyib natija
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Hozircha topshirmagan bo‘limlar mavjud emas.
          </p>
        </div>
      )}
    </div>
  </section>
      </div>
    </div>
  );
}

export default EmployeeProfile;

