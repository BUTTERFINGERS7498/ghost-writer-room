import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl">🌫️</p>
      <h1 className="mt-4 font-display text-4xl font-semibold">This page has vanished</h1>
      <p className="mt-2 text-faded">Perhaps it was only ever a ghost branch.</p>
      <Link to="/" className="btn btn-primary mt-6">
        Back to stories
      </Link>
    </div>
  );
}
