import User from '../models/User.js';
import Story from '../models/Story.js';
import Paragraph from '../models/Paragraph.js';
import { HttpError } from '../utils/helpers.js';

export async function getProfile(req, res) {
  const user = await User.findById(req.params.id).select('-email');
  if (!user) throw new HttpError(404, 'User not found');

  const [stories, paragraphs] = await Promise.all([
    Story.find({ creator: user._id }).sort({ createdAt: -1 }).select('title genre status currentRound settings.maxRounds'),
    Paragraph.find({ author: user._id, round: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('story content round voteCount isCanon createdAt')
      .populate('story', 'title'),
  ]);

  res.json({ user, stories, paragraphs });
}
