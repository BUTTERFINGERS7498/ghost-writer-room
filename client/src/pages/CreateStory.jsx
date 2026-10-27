import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { ErrorBox } from '../components/Spinner.jsx';
import { GENRES, GENRE_EMOJI, ROUND_PRESETS } from '../utils/format.js';

const CHAR_LIMITS = [300, 500, 800, 1200];

export default function CreateStory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    genre: 'fantasy',
    opening: '',
    maxChars: 500,
    roundDurationMins: 1440,
    maxRounds: 10,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const tooLong = form.opening.length > form.maxChars;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { story } = await api('/stories', {
        method: 'POST',
        body: {
          title: form.title,
          genre: form.genre,
          opening: form.opening,
          settings: {
            maxChars: Number(form.maxChars),
            roundDurationMins: Number(form.roundDurationMins),
            maxRounds: Number(form.maxRounds),
          },
        },
      });
      navigate(`/stories/${story._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl font-semibold">Begin a new tale</h1>
      <p className="mt-2 text-faded">Write the opening. Everything after belongs to the room.</p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6">
        <ErrorBox message={error} />

        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input id="title" className="input" required maxLength={100} value={form.title} onChange={set('title')} />
        </div>

        <div>
          <span className="label">Genre</span>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setForm((f) => ({ ...f, genre: g }))}
                className={`rounded-full border px-3 py-1 text-sm capitalize transition ${
                  form.genre === g ? 'border-ghost bg-ghost/10 text-ghost' : 'border-line text-faded hover:text-paper'
                }`}
              >
                {GENRE_EMOJI[g]} {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="opening">
            Opening paragraph
          </label>
          <textarea
            id="opening"
            className="input min-h-40 font-serif leading-relaxed"
            required
            placeholder="The lighthouse keeper had not seen a ship in eleven years, until tonight…"
            value={form.opening}
            onChange={set('opening')}
          />
          <p className={`mt-1 text-right text-xs ${tooLong ? 'text-blood' : 'text-faded'}`}>
            {form.opening.length} / {form.maxChars}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="maxChars">
              Paragraph limit
            </label>
            <select id="maxChars" className="input" value={form.maxChars} onChange={set('maxChars')}>
              {CHAR_LIMITS.map((n) => (
                <option key={n} value={n}>
                  {n} characters
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="duration">
              Round length
            </label>
            <select id="duration" className="input" value={form.roundDurationMins} onChange={set('roundDurationMins')}>
              {ROUND_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maxRounds">
              Rounds
            </label>
            <input
              id="maxRounds"
              type="number"
              min={1}
              max={50}
              className="input"
              value={form.maxRounds}
              onChange={set('maxRounds')}
            />
          </div>
        </div>

        <button className="btn btn-primary w-full py-2.5" disabled={busy || tooLong}>
          {busy ? 'Opening the room…' : 'Open the room'}
        </button>
      </form>
    </div>
  );
}
