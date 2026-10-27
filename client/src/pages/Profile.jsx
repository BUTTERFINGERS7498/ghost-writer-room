import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Avatar from '../components/Avatar.jsx';
import Spinner, { ErrorBox } from '../components/Spinner.jsx';
import { GENRE_EMOJI, timeAgo } from '../utils/format.js';

function Stat({ label, value }) {
  return (
    <div className="card px-5 py-4 text-center">
      <p className="font-display text-3xl font-semibold text-ghost">{value}</p>
      <p className="text-xs uppercase tracking-wider text-faded">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api(`/users/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;

  const { user, stories, paragraphs } = data;
  const { contributions, wins, storiesStarted } = user.stats;
  const winRate = contributions ? Math.round((wins / contributions) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-5">
        <Avatar name={user.username} size={72} />
        <div>
          <h1 className="font-display text-4xl font-semibold">{user.username}</h1>
          <p className="text-sm text-faded">Writing since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Entries" value={contributions} />
        <Stat label="Rounds won" value={wins} />
        <Stat label="Win rate" value={`${winRate}%`} />
        <Stat label="Stories started" value={storiesStarted} />
      </div>

      {stories.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-2xl font-semibold">Stories started</h2>
          <div className="space-y-2">
            {stories.map((s) => (
              <Link
                key={s._id}
                to={`/stories/${s._id}`}
                className="card flex items-center justify-between px-4 py-3 hover:border-ghost-dim"
              >
                <span>
                  {GENRE_EMOJI[s.genre]} {s.title}
                </span>
                <span className="text-xs text-faded">
                  {s.status === 'completed' ? '✓ Completed' : `Round ${s.currentRound}/${s.settings.maxRounds}`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl font-semibold">Recent entries</h2>
        {paragraphs.length === 0 && <p className="text-faded">No entries yet.</p>}
        <div className="space-y-3">
          {paragraphs.map((p) => (
            <Link key={p._id} to={`/stories/${p.story?._id}`} className="card block p-4 hover:border-ghost-dim">
              <div className="mb-2 flex justify-between text-xs text-faded">
                <span>
                  {p.story?.title} · round {p.round}
                </span>
                <span>{p.isCanon ? <span className="text-ghost">★ Became canon</span> : `▲ ${p.voteCount}`}</span>
              </div>
              <p className="line-clamp-2 font-serif text-sm">{p.content}</p>
              <p className="mt-2 text-xs text-faded">{timeAgo(p.createdAt)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
