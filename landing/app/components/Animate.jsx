'use client';
import { useEffect, useRef, useState } from 'react';

const HIDDEN = {
  bottom: 'translateY(22px)',
  top:    'translateY(-16px)',
  left:   'translateX(-22px)',
  right:  'translateX(22px)',
  scale:  'scale(0.96)',
};

export default function Animate({
  children,
  delay = 0,
  from = 'bottom',
  threshold = 0.08,
  className = '',
  style = {},
  ...rest
}) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'none' : (HIDDEN[from] ?? HIDDEN.bottom),
        transition: `opacity 0.55s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.55s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
