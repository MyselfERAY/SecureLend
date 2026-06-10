'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Görünür olduğunda 0'dan hedef değere doğru sayan animasyonlu sayı.
 * Hareket azaltma tercih edildiyse doğrudan hedef değeri gösterir.
 */
export default function CountUp({
  end,
  decimals = 0,
  duration = 1400,
  prefix = '',
  suffix = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(end);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(end * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
