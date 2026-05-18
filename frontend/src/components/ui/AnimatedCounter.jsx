import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * AnimatedCounter — Viewport'a girince 0'dan hedef sayıya kadar sayarak artar.
 */
export default function AnimatedCounter({
  target,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(startValue + (target - startValue) * eased);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('tr-TR')}{suffix}
    </span>
  );
}
