export default function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  let message = err.message || 'Server xatosi';

  if (err.code === '28P01') {
    message = 'PostgreSQL autentifikatsiyasi muvaffaqiyatsiz. backend/.env faylida DATABASE_URL parolini tekshiring.';
  } else if (err.message?.includes('password authentication failed') || err.message?.includes('утификация')) {
    message = 'PostgreSQL autentifikatsiyasi muvaffaqiyatsiz. DATABASE_URL ni tekshiring.';
  }

  return res.status(status).json({ error: message });
}
