import { useCountdown } from '../hooks/useCountdown.js';
import { formatDuration } from '../utils/format.js';

export default function Countdown({ endsAt, onExpire }) {
  const left = useCountdown(endsAt, onExpire);
  return <span className="tabular-nums">{left > 0 ? formatDuration(left) : 'closing…'}</span>;
}
