export default function Spinner({ label = 'Summoning…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-faded">
      <span className="animate-bounce text-4xl">👻</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="rounded-lg border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-blood">{message}</div>;
}
