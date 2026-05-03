import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * ScrollReveal — Viewport'a girince fade-in + slide-up animasyonu.
 * Framer Motion useInView ile çalışır.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 40,
  once = true,
  className = '',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const directionMap = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { y: 0, x: distance },
    right: { y: 0, x: -distance },
  };

  const offset = directionMap[direction] || directionMap.up;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
