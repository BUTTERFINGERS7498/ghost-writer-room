import { Link } from 'react-router-dom';
import { GENRE_EMOJI } from '../utils/format.js';
import Countdown from './Countdown.jsx';

export default function StoryCard({ story }) {
  const done = story.status === 'completed';

  return (
    <Link
      to={`/stories/${story._id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-ghost-dim"
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-fog px-2.5 py-1 capitalize text-faded">
          {GENRE_EMOJI[story.genre]} {story.genre}
        </span>
        {done ? (
          <span className="text-faded">✓ Completed</span>
        ) : (
          <span className="text-ghost">
            ⏳ <Countdown endsAt={story.roundEndsAt} />
          </span>
        )}
      </div>

      <h3 className="font-display text-2xl font-semibold leading-tight group-hover:text-ghost">{story.title}</h3>

      <p className="mt-2 line-clamp-3 flex-1 font-serif text-sm italic text-faded">
        “{story.canonTip?.content}”
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-faded">
        <span>by {story.creator?.username}</span>
        <span>
          {done ? `${story.currentRound} rounds` : `Round ${story.currentRound}/${story.settings.maxRounds}`} ·{' '}
          {story.contributorCount} ✍️
        </span>
      </div>
    </Link>
  );
}
