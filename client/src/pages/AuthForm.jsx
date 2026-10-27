import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBox } from '../components/Spinner.jsx';

// Shared layout and submit handling for the login and register pages.
export default function AuthForm({ title, subtitle, fields, submitLabel, onSubmit, footer }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ''])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(values);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-6">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-faded">{subtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <ErrorBox message={error} />
        {fields.map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={f.name}>
              {f.label}
            </label>
            <input
              id={f.name}
              className="input"
              type={f.type || 'text'}
              autoComplete={f.autoComplete}
              required
              value={values[f.name]}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
          </div>
        ))}
        <button className="btn btn-primary w-full py-2.5" disabled={busy}>
          {busy ? 'Please wait…' : submitLabel}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-faded">
        {footer.text}{' '}
        <Link to={footer.to} state={location.state} className="text-ghost hover:underline">
          {footer.link}
        </Link>
      </p>
    </div>
  );
}
