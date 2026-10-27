import { z } from 'zod';
import { GENRES } from '../models/Story.js';

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export const createStorySchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  genre: z.enum(GENRES).default('other'),
  opening: z.string().trim().min(20, 'Opening paragraph must be at least 20 characters'),
  settings: z
    .object({
      maxChars: z.number().int().min(100).max(2000).default(500),
      roundDurationMins: z.number().int().min(1).max(10080).default(1440),
      maxRounds: z.number().int().min(1, 'At least 1 round').max(50, 'At most 50 rounds').default(10),
    })
    .default({}),
});

export const entrySchema = z.object({
  content: z.string().trim().min(10, 'Your paragraph must be at least 10 characters'),
});
