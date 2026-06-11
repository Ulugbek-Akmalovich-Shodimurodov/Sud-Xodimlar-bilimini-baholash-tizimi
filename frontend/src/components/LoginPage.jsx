import { useEffect, useState } from 'react';
import { loginAdmin } from '../api.js';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 2000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { token, user } = await loginAdmin({ username, password });
      onLogin(token, user);
    } catch (err) {
      setError(err.response?.data?.error || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Admin tizimiga kirish</h1>
      <p className="mt-2 text-indigo-600">Foydalanuvchi nomi va parol bilan tizimga kiring.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-indigo-700">Foydalanuvchi nomi</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[A-Za-z0-9_]+"
            title="Foydalanuvchi nomi faqat lotin harflari, raqamlar va pastki chiziqdan iborat bo‘lishi kerak"
            className="mt-2 w-full border border-indigo-100 bg-white px-3 py-3 text-slate-900"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-indigo-700">Parol</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-indigo-100 bg-white px-3 py-3 text-slate-900"
          />
        </label>

        {error && <div className="rounded-2xl bg-red-100 p-3 text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-indigo-900 px-5 py-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Yuklanmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;

