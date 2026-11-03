import confetti from 'canvas-confetti';

/**
 * Fires a lightweight celebration confetti burst.
 * Safely guards against Server-Side Rendering (SSR).
 */
export function fireConfettiBurst() {
  if (typeof window === 'undefined') return;

  // Visual celebration burst using grayscale cool theme colors
  confetti({
    particleCount: 60,
    spread: 60,
    origin: { y: 0.8 },
    colors: ['#F8F9FA', '#E9ECEF', '#DEE2E6', '#343A40'],
    ticks: 200,
    gravity: 1.2,
    scalar: 0.9,
    shapes: ['circle', 'square'],
  });
}

