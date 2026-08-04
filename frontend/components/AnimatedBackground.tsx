'use client';

import { useEffect, useRef } from 'react';

/**
 * Canvas starfield in the brand's gold/teal — large four-point stars that
 * drift slowly and twinkle. Plain 2D canvas, no 3D/WebGL library, so it stays
 * cheap on low-end phones.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ['#E8A33D', '#2FA971'];

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      phase: number;
      speed: number;
    }[] = [];
    let frameId = 0;
    let running = true;

    function resize() {
      const el = canvasRef.current;
      if (!el) return;
      width = el.clientWidth;
      height = el.clientHeight;
      el.width = width * dpr;
      el.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 14 : 22;
      stars = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        // a few hero stars are extra large, the rest medium
        size: i < count / 4 ? Math.random() * 22 + 26 : Math.random() * 12 + 10,
        color: colors[Math.random() < 0.55 ? 0 : 1],
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.008,
      }));
    }

    /** Classic four-point sparkle: points pulled toward the center with quadratic curves. */
    function drawStar(x: number, y: number, size: number, color: string, alpha: number) {
      const c = ctx!;
      const pinch = size * 0.18;

      const glow = c.createRadialGradient(x, y, 0, x, y, size * 1.6);
      glow.addColorStop(0, color + '55');
      glow.addColorStop(1, color + '00');
      c.globalAlpha = alpha;
      c.fillStyle = glow;
      c.beginPath();
      c.arc(x, y, size * 1.6, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x, y - size);
      c.quadraticCurveTo(x + pinch, y - pinch, x + size, y);
      c.quadraticCurveTo(x + pinch, y + pinch, x, y + size);
      c.quadraticCurveTo(x - pinch, y + pinch, x - size, y);
      c.quadraticCurveTo(x - pinch, y - pinch, x, y - size);
      c.closePath();
      c.fill();
      c.globalAlpha = 1;
    }

    function drawFrame(animate: boolean) {
      ctx!.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (animate) {
          s.x += s.vx;
          s.y += s.vy;
          s.phase += s.speed;
          const margin = s.size * 2;
          if (s.x < -margin) s.x = width + margin;
          if (s.x > width + margin) s.x = -margin;
          if (s.y < -margin) s.y = height + margin;
          if (s.y > height + margin) s.y = -margin;
        }
        // twinkle between dim and bright
        const alpha = 0.25 + (Math.sin(s.phase) + 1) * 0.3;
        const size = s.size * (0.85 + (Math.sin(s.phase) + 1) * 0.075);
        drawStar(s.x, s.y, size, s.color, alpha);
      }
    }

    function tick() {
      if (!running) return;
      drawFrame(true);
      frameId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!reduceMotion) {
        running = true;
        frameId = requestAnimationFrame(tick);
      }
    }

    resize();
    if (reduceMotion) {
      drawFrame(false);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
}
