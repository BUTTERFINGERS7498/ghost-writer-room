import { useEffect, useRef, useState } from 'react';

// Returns milliseconds left until `endsAt`, and calls `onExpire` once when it reaches zero.
export function useCountdown(endsAt, onExpire) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  const [left, setLeft] = useState(() => (target ? target - Date.now() : 0));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!target) return;
    let fired = false;
    const tick = () => {
      const remaining = target - Date.now();
      setLeft(remaining);
      if (remaining <= 0 && !fired) {
        fired = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return Math.max(0, left);
}
