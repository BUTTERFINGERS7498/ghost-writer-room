import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export const GENRES = ['fantasy', 'sci-fi', 'horror', 'mystery', 'romance', 'comedy', 'thriller', 'other'];

const storySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    genre: { type: String, enum: GENRES, default: 'other' },
    creator: { type: ObjectId, ref: 'User', required: true },
    settings: {
      maxChars: { type: Number, default: 500, min: 100, max: 2000 },
      roundDurationMins: { type: Number, default: 1440, min: 1, max: 10080 },
      maxRounds: { type: Number, default: 10, min: 1, max: 50 },
    },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    // Round 0 is the opening paragraph; contributions start at round 1.
    currentRound: { type: Number, default: 1 },
    roundEndsAt: { type: Date, required: true },
    // Last paragraph of the canon path. New entries branch from here.
    canonTip: { type: ObjectId, ref: 'Paragraph' },
    contributors: [{ type: ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

storySchema.index({ status: 1, roundEndsAt: 1 });
storySchema.index({ genre: 1, status: 1, createdAt: -1 });

export default mongoose.model('Story', storySchema);
