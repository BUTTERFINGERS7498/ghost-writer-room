import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const paragraphSchema = new mongoose.Schema(
  {
    story: { type: ObjectId, ref: 'Story', required: true },
    parent: { type: ObjectId, ref: 'Paragraph', default: null },
    // Full path from the opening paragraph, so a whole branch loads in one query.
    ancestors: [{ type: ObjectId, ref: 'Paragraph' }],
    author: { type: ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    round: { type: Number, required: true },
    voters: [{ type: ObjectId, ref: 'User' }],
    voteCount: { type: Number, default: 0 },
    isCanon: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One entry per user per round (also serves "entries for this round" queries).
paragraphSchema.index({ story: 1, round: 1, author: 1 }, { unique: true });
paragraphSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Paragraph', paragraphSchema);
