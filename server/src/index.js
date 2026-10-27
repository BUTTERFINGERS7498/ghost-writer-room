import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import storyRoutes from './routes/stories.js';
import paragraphRoutes from './routes/paragraphs.js';
import userRoutes from './routes/users.js';
import { notFound, errorHandler } from './middleware/error.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
}

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const app = express();

app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/paragraphs', paragraphRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server, clientUrl);

const PORT = process.env.PORT || 5000;
await connectDB(process.env.MONGO_URI);
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
