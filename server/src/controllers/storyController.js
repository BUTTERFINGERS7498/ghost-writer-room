import Story, { GENRES } from '../models/Story.js';
import Paragraph from '../models/Paragraph.js';
import User from '../models/User.js';
import { settleRound } from '../services/roundService.js';
import { HttpError, minutes, escapeRegex } from '../utils/helpers.js';

const PAGE_SIZE = 12;

async function findStoryOr404(id) {
  const story = await Story.findById(id);
  if (!story) throw new HttpError(404, 'Story not found');
  return settleRound(story);
}

export async function listStories(req, res) {
  const { genre, status, sort = 'new', q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  // Settle any rounds that ran out while nobody was looking, so the list is current.
  const expired = await Story.find({ status: 'active', roundEndsAt: { $lte: new Date() } }).limit(50);
  await Promise.all(expired.map(settleRound));

  const filter = {};
  if (GENRES.includes(genre)) filter.genre = genre;
  if (status === 'active' || status === 'completed') filter.status = status;
  if (typeof q === 'string' && q.trim()) filter.title = { $regex: escapeRegex(q.trim()), $options: 'i' };

  let order = { createdAt: -1 };
  if (sort === 'ending') {
    filter.status = 'active';
    order = { roundEndsAt: 1 };
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .sort(order)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate('creator', 'username')
      .populate('canonTip', 'content')
      .lean(),
    Story.countDocuments(filter),
  ]);

  res.json({
    stories: stories.map(({ contributors, ...s }) => ({ ...s, contributorCount: contributors.length })),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function createStory(req, res) {
  const { title, genre, opening, settings } = req.body;
  if (opening.length > settings.maxChars) {
    throw new HttpError(400, `Opening paragraph must be at most ${settings.maxChars} characters`);
  }

  const story = new Story({
    title,
    genre,
    settings,
    creator: req.user._id,
    contributors: [req.user._id],
    roundEndsAt: new Date(Date.now() + minutes(settings.roundDurationMins)),
  });
  const openingParagraph = await Paragraph.create({
    story: story._id,
    author: req.user._id,
    content: opening,
    round: 0,
    isCanon: true,
  });
  story.canonTip = openingParagraph._id;

  try {
    await story.save();
  } catch (err) {
    await Paragraph.deleteOne({ _id: openingParagraph._id });
    throw err;
  }

  await User.updateOne({ _id: req.user._id }, { $inc: { 'stats.storiesStarted': 1 } });
  res.status(201).json({ story });
}

export async function getStory(req, res) {
  const story = await findStoryOr404(req.params.id);
  const tip = await Paragraph.findById(story.canonTip).select('ancestors');

  const [canon, entries] = await Promise.all([
    Paragraph.find({ _id: { $in: [...tip.ancestors, tip._id] } })
      .sort({ round: 1 })
      .select('-voters')
      .populate('author', 'username'),
    story.status === 'active'
      ? Paragraph.find({ story: story._id, round: story.currentRound })
          .sort({ createdAt: 1 })
          .populate('author', 'username')
      : [],
  ]);
  await story.populate('creator', 'username');

  res.json({ story, canon, entries });
}

export async function getTree(req, res) {
  const story = await findStoryOr404(req.params.id);
  const nodes = await Paragraph.find({ story: story._id })
    .select('parent author content round voteCount isCanon createdAt')
    .sort({ round: 1, createdAt: 1 })
    .populate('author', 'username')
    .lean();

  res.json({ story: { _id: story._id, title: story.title, currentRound: story.currentRound, status: story.status }, nodes });
}
