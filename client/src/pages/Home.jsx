import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StoryCard from '../components/StoryCard.jsx';
import Spinner, { ErrorBox } from '../components/Spinner.jsx';
import { GENRES, GENRE_EMOJI } from '../utils/format.js';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Live', value: 'active' },
  { label: 'Finished', value: 'completed' },
];

export default function Home() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ genre: '', status: '', sort: 'new', q: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => set('q', search), 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ ...filters, page });
    for (const [k, v] of [...params]) if (!v) params.delete(k);
    setError('');
    api(`/stories?${params}`)
      .then((d) => !ignore && setData(d))
      .catch((e) => !ignore && setError(e.message));
    return () => {
      ignore = true;
    };
  }, [filters, page]);

  function set(key, value) {
    setFilters((f) => (f[key] === value ? f : { ...f, [key]: value }));
    setPage(1);
  }
  const chip = (active) =>
    `rounded-full border px-3 py-1 text-sm capitalize transition ${
      active ? 'border-ghost bg-ghost/10 text-ghost' : 'border-line text-faded hover:text-paper'
    }`;

  return (
    <div>
      <section className="mb-12 pt-6 text-center">
        <h1 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">
          One story. Many hands. <span className="italic text-ghost">No single author.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-faded">
          Each round, writers propose the next paragraph and the room votes. The winner becomes canon, and the rest
          drift on as ghost branches.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to={user ? '/new' : '/register'} className="btn btn-primary px-6 py-2.5">
            Start a story
          </Link>
          <a href="#stories" className="btn btn-ghost px-6 py-2.5">
            Read along
          </a>
        </div>
      </section>

      <section id="stories" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {STATUS_TABS.map((t) => (
              <button key={t.label} onClick={() => set('status', t.value)} className={chip(filters.status === t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input sm:w-56"
              placeholder="Search titles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input w-auto" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="new">Newest</option>
              <option value="ending">Ending soon</option>
            </select>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button onClick={() => set('genre', '')} className={chip(!filters.genre)}>
            All genres
          </button>
          {GENRES.map((g) => (
            <button key={g} onClick={() => set('genre', g)} className={chip(filters.genre === g)}>
              {GENRE_EMOJI[g]} {g}
            </button>
          ))}
        </div>

        <ErrorBox message={error} />
        {!data && !error && <Spinner />}
        {data?.stories.length === 0 && (
          <div className="card py-16 text-center text-faded">
            <p className="text-4xl">🕸️</p>
            <p className="mt-3">No stories here yet. Be the first to start one.</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.stories.map((s) => (
            <StoryCard key={s._id} story={s} />
          ))}
        </div>

        {data?.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </button>
            <span className="text-faded">
              Page {data.page} of {data.totalPages}
            </span>
            <button className="btn btn-ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
