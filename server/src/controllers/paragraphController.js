import Story from '../models/Story.js';
import Paragraph from '../models/Paragraph.js';
import User from '../models/User.js';
import { settleRound } from '../services/roundService.js';
import { emitToStory } from '../socket.js';
import { HttpError } from '../utils/helpers.js';

export async function submitEntry(req, res) {
  let story = await Story.findById(req.params.id);
  if (!story) throw new HttpError(404, 'Story not found');
  story = await settleRound(story);

  if (story.status !== 'active') throw new HttpError(400, 'This story has already ended');
  const { content } = req.body;
  if (content.length > story.settings.maxChars) {
    throw new HttpError(400, `Your paragraph must be at most ${story.settings.maxChars} characters`);
  }

  const tip = await Paragraph.findById(story.canonTip).select('ancestors');
  let entry;
  try {
    entry = await Paragraph.create({
      story: story._id,
      parent: tip._id,
      ancestors: [...tip.ancestors, tip._id],
      author: req.user._id,
      content,
      round: story.currentRound,
    });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'You already submitted an entry this round');
    throw err;
  }

  await Promise.all([
    Story.updateOne({ _id: story._id }, { $addToSet: { contributors: req.user._id } }),
    User.updateOne({ _id: req.user._id }, { $inc: { 'stats.contributions': 1 } }),
  ]);
  await entry.populate('author', 'username');

  emitToStory(story._id, 'entry:new', entry);
  res.status(201).json({ entry });
}

// Each user gets one vote per round. Voting for an entry moves the vote there;
// voting for the same entry again removes it.
export async function toggleVote(req, res) {
  const entry = await Paragraph.findById(req.params.id);
  if (!entry) throw new HttpError(404, 'Entry not found');

  const story = await settleRound(await Story.findById(entry.story));
  if (story.status !== 'active' || entry.round !== story.currentRound) {
    throw new HttpError(400, 'Voting for this round has closed');
  }

  const userId = req.user._id;
  if (entry.author.equals(userId)) throw new HttpError(400, "You can't vote for your own entry");

  if (entry.voters.some((v) => v.equals(userId))) {
    await Paragraph.updateOne({ _id: entry._id, voters: userId }, { $pull: { voters: userId }, $inc: { voteCount: -1 } });
  } else {
    await Paragraph.updateMany(
      { story: entry.story, round: entry.round, voters: userId },
      { $pull: { voters: userId }, $inc: { voteCount: -1 } }
    );
    await Paragraph.updateOne(
      { _id: entry._id, voters: { $ne: userId } },
      { $push: { voters: userId }, $inc: { voteCount: 1 } }
    );
  }

  const votes = await Paragraph.find({ story: entry.story, round: entry.round }).select('voteCount voters').lean();
  emitToStory(entry.story, 'votes:updated', votes);
  res.json({ votes });
}
