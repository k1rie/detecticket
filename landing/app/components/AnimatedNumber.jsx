'use client';
import { useEffect, useRef, useState } from 'react';

function parse(value) {
  const m = String(value).match(/^(\d+\.?\d*)(.*)/);
  return m ? { num: parseFloat(m[1]), suffix: m[2] } : null;
}

export default function AnimatedNumber({ value, duration = 900, delay = 0 }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState('0');
  const [active, setActive] = useState(false);
  const parsed = parse(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setActive(true); io.disconnect(); } },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !parsed) { setDisplay(value); return; }
    const { num, suffix } = parsed;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      if (now < t0) { requestAnimationFrame(tick); return; }
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(`${Math.round(ease * num)}${suffix}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active]);

  return <span ref={ref}>{display}</span>;
}
