import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, socket } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Countdown from '../components/Countdown.jsx';
import Spinner, { ErrorBox } from '../components/Spinner.jsx';
import { GENRE_EMOJI, timeAgo } from '../utils/format.js';

export default function StoryRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [presence, setPresence] = useState(1);

  const load = useCallback(
    () =>
      api(`/stories/${id}`)
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((e) => setError(e.message)),
    [id]
  );

  useEffect(() => {
    load();

    const join = () => socket.emit('story:join', id);
    const onEntry = (entry) =>
      setData((d) =>
        d && entry.round === d.story.currentRound && !d.entries.some((e) => e._id === entry._id)
          ? { ...d, entries: [...d.entries, entry] }
          : d
      );
    const onVotes = (votes) =>
      setData((d) => {
        if (!d) return d;
        const byId = new Map(votes.map((v) => [v._id, v]));
        return { ...d, entries: d.entries.map((e) => (byId.has(e._id) ? { ...e, ...byId.get(e._id) } : e)) };
      });

    join();
    socket.on('connect', join);
    socket.on('entry:new', onEntry);
    socket.on('votes:updated', onVotes);
    socket.on('round:closed', load);
    socket.on('presence', setPresence);
    return () => {
      socket.emit('story:leave', id);
      socket.off('connect', join);
      socket.off('entry:new', onEntry);
      socket.off('votes:updated', onVotes);
      socket.off('round:closed', load);
      socket.off('presence', setPresence);
    };
  }, [id, load]);

  if (error && !data) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;

  const { story, canon, entries } = data;
  const active = story.status === 'active';

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10 text-center">
        <p className="text-sm text-faded">
          {GENRE_EMOJI[story.genre]} <span className="capitalize">{story.genre}</span> · started by{' '}
          <Link to={`/users/${story.creator._id}`} className="hover:text-ghost">
            {story.creator.username}
          </Link>
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold leading-tight">{story.title}</h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-faded">
          {active ? (
            <>
              <span>
                Round <b className="text-paper">{story.currentRound}</b> of {story.settings.maxRounds}
              </span>
              <span className="text-ghost">
                ⏳ closes in{' '}
                {/* Rounds settle lazily on the server, so refetching once the timer ends closes the round. */}
                <Countdown endsAt={story.roundEndsAt} onExpire={() => setTimeout(load, 1000)} />
              </span>
            </>
          ) : (
            <span>✓ Completed after {story.currentRound} rounds</span>
          )}
          <span>
            👻 {presence} {presence === 1 ? 'reader' : 'readers'} here
          </span>
          <Link to={`/stories/${story._id}/tree`} className="text-ghost hover:underline">
            View branch tree →
          </Link>
        </div>
      </header>

      <article className="space-y-6 font-serif text-lg leading-relaxed">
        {canon.map((p, i) => (
          <div key={p._id} className="group relative">
            <p className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-none first-letter:text-ghost' : ''}>
              {p.content}
            </p>
            <span className="mt-1 block font-sans text-xs text-faded opacity-0 transition group-hover:opacity-100">
              — {p.author.username}
              {p.round > 0 && `, round ${p.round}`}
            </span>
          </div>
        ))}
        {!active && <p className="pt-4 text-center font-display text-2xl italic text-ghost">~ The End ~</p>}
      </article>

      {active && <RoundPanel story={story} entries={entries} user={user} onSubmitted={load} />}
    </div>
  );
}

function RoundPanel({ story, entries, user, onSubmitted }) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const myEntry = user && entries.find((e) => e.author._id === user._id);
  const topVotes = Math.max(0, ...entries.map((e) => e.voteCount));
  const tooLong = draft.length > story.settings.maxChars;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/stories/${story._id}/paragraphs`, { method: 'POST', body: { content: draft } });
      setDraft('');
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function vote(entryId) {
    setError('');
    try {
      await api(`/paragraphs/${entryId}/vote`, { method: 'POST' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="font-display text-3xl font-semibold">What happens next?</h2>
      <p className="mt-1 text-sm text-faded">
        Round {story.currentRound}: propose a continuation or vote for your favourite. You get one entry and one vote
        per round.
      </p>

      <div className="mt-4">
        <ErrorBox message={error} />
      </div>

      <div className="mt-6 space-y-4">
        {entries.length === 0 && (
          <p className="card p-6 text-center text-faded">No entries yet. The next line could be yours.</p>
        )}
        {entries.map((entry) => {
          const mine = user && entry.author._id === user._id;
          const voted = user && entry.voters.includes(user._id);
          const leading = entry.voteCount > 0 && entry.voteCount === topVotes;
          return (
            <div key={entry._id} className={`card p-5 ${voted ? 'border-ghost-dim' : ''}`}>
              <p className="font-serif leading-relaxed">{entry.content}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-faded">
                  <Avatar name={entry.author.username} size={22} />
                  {entry.author.username} · {timeAgo(entry.createdAt)}
                  {leading && <span title="Currently leading">👑</span>}
                </span>
                {mine ? (
                  <span className="text-xs text-faded">Your entry · {entry.voteCount} votes</span>
                ) : (
                  <button
                    onClick={() => vote(entry._id)}
                    disabled={!user}
                    title={user ? (voted ? 'Remove your vote' : 'Vote for this') : 'Log in to vote'}
                    className={`btn px-3 py-1 ${voted ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {voted ? '✓ Voted' : '▲ Vote'} · {entry.voteCount}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        {!user ? (
          <p className="card p-6 text-center text-faded">
            <Link to="/login" state={{ from: `/stories/${story._id}` }} className="text-ghost hover:underline">
              Log in
            </Link>{' '}
            to write the next paragraph or vote.
          </p>
        ) : myEntry ? (
          <p className="text-center text-sm text-faded">
            ✍️ Your entry is in for this round. Now read the others and vote.
          </p>
        ) : (
          <form onSubmit={submit} className="card p-5">
            <label htmlFor="draft" className="label">
              Your continuation
            </label>
            <textarea
              id="draft"
              className="input min-h-32 font-serif leading-relaxed"
              placeholder="And then…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              required
            />
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs ${tooLong ? 'text-blood' : 'text-faded'}`}>
                {draft.length} / {story.settings.maxChars}
              </span>
              <button className="btn btn-primary" disabled={busy || tooLong || draft.trim().length < 10}>
                {busy ? 'Submitting…' : 'Submit entry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
