import { HttpError } from '../utils/helpers.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.name === 'CastError') return res.status(404).json({ message: 'Not found' });
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    return res.status(409).json({ message: `That ${field} is already taken` });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });

  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
}
