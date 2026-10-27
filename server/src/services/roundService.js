import Story from '../models/Story.js';
import Paragraph from '../models/Paragraph.js';
import User from '../models/User.js';
import { emitToStory } from '../socket.js';
import { minutes } from '../utils/helpers.js';

/**
 * Closes the story's current round if its deadline has passed.
 *
 * Rounds are settled lazily whenever a story is read, so no cron job is needed.
 * The conditional update means that if two requests race, only one settles the round.
 */
export async function settleRound(story) {
  if (story.status !== 'active' || story.roundEndsAt > new Date()) return story;

  const round = story.currentRound;
  const winner = await Paragraph.findOne({ story: story._id, round }).sort({ voteCount: -1, createdAt: 1 });
  const nextEndsAt = new Date(Date.now() + minutes(story.settings.roundDurationMins));

  let update;
  if (!winner) {
    // Nobody wrote anything: give the round another full period.
    update = { roundEndsAt: nextEndsAt };
  } else {
    const finished = round >= story.settings.maxRounds;
    update = {
      canonTip: winner._id,
      currentRound: finished ? round : round + 1,
      status: finished ? 'completed' : 'active',
      roundEndsAt: finished ? story.roundEndsAt : nextEndsAt,
    };
  }

  const settled = await Story.findOneAndUpdate(
    { _id: story._id, status: 'active', currentRound: round, roundEndsAt: story.roundEndsAt },
    update,
    { new: true }
  );
  // Another request settled this round first.
  if (!settled) return Story.findById(story._id);

  if (winner) {
    await Promise.all([
      Paragraph.updateOne({ _id: winner._id }, { isCanon: true }),
      User.updateOne({ _id: winner.author }, { $inc: { 'stats.wins': 1 } }),
    ]);
  }

  emitToStory(story._id, 'round:closed', {
    round,
    winnerId: winner?._id ?? null,
    status: settled.status,
  });
  return settled;
}
