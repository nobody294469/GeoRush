import React, { useEffect, useState, useRef } from 'react';

interface AnimatedScoreProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatWithCommas?: boolean;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  duration = 750,
  prefix = '',
  suffix = '',
  className = '',
  formatWithCommas = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const startValRef = useRef<number>(0);
  const targetValRef = useRef<number>(value);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(Math.round(value));
      startValRef.current = value;
      return;
    }

    const startVal = startValRef.current;
    const targetVal = value;
    targetValRef.current = targetVal;
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out curve: 1 - (1 - t)^3
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentInterpolated = Math.round(startVal + (targetVal - startVal) * easeOutProgress);

      setDisplayValue(currentInterpolated);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(Math.round(targetVal));
        startValRef.current = targetVal;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formattedNumber = formatWithCommas
    ? displayValue.toLocaleString()
    : displayValue.toString();

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
