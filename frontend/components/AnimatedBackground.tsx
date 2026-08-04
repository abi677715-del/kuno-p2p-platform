'use client';

import { useEffect, useRef } from 'react';

/**
 * Canvas starfield in the brand's gold/teal — large four-point stars that
 * drift slowly and twinkle, and can be grabbed and dragged around with the
 * mouse or a finger. Plain 2D canvas, no 3D/WebGL library, so it stays cheap
 * on low-end phones. pointer-events stays enabled only where it's needed
 * (grabbing a star); everywhere else clicks pass through to the real UI
 * beneath since that content sits at a higher z-index.
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

    let draggingIndex = -1;
    let lastPointer = { x: 0, y: 0, t: 0 };

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
      stars.forEach((s, i) => {
        if (animate && i !== draggingIndex) {
          s.x += s.vx;
          s.y += s.vy;
          const margin = s.size * 2;
          if (s.x < -margin) s.x = width + margin;
          if (s.x > width + margin) s.x = -margin;
          if (s.y < -margin) s.y = height + margin;
          if (s.y > height + margin) s.y = -margin;
        }
        if (animate || i === draggingIndex) s.phase += s.speed;
        // twinkle between dim and bright, a bit brighter while held
        const held = i === draggingIndex;
        const alpha = (held ? 0.45 : 0.25) + (Math.sin(s.phase) + 1) * 0.3;
        const size = s.size * (held ? 1.15 : 1) * (0.85 + (Math.sin(s.phase) + 1) * 0.075);
        drawStar(s.x, s.y, size, s.color, Math.min(alpha, 1));
      });
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

    function pointFromEvent(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function starIndexAt(x: number, y: number) {
      let closest = -1;
      let closestDist = Infinity;
      stars.forEach((s, i) => {
        const dist = Math.hypot(s.x - x, s.y - y);
        const hitRadius = s.size + 16;
        if (dist <= hitRadius && dist < closestDist) {
          closest = i;
          closestDist = dist;
        }
      });
      return closest;
    }

    function onPointerDown(e: PointerEvent) {
      const p = pointFromEvent(e);
      const idx = starIndexAt(p.x, p.y);
      if (idx === -1) return;
      draggingIndex = idx;
      stars[idx].vx = 0;
      stars[idx].vy = 0;
      lastPointer = { x: p.x, y: p.y, t: performance.now() };
      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = 'grabbing';
      if (reduceMotion) drawFrame(false);
    }

    function onPointerMove(e: PointerEvent) {
      const p = pointFromEvent(e);
      if (draggingIndex !== -1) {
        const star = stars[draggingIndex];
        star.x = p.x;
        star.y = p.y;
        const now = performance.now();
        const dt = Math.max(now - lastPointer.t, 1);
        star.vx = ((p.x - lastPointer.x) / dt) * 12;
        star.vy = ((p.y - lastPointer.y) / dt) * 12;
        lastPointer = { x: p.x, y: p.y, t: now };
        if (reduceMotion) drawFrame(false);
      } else {
        canvas!.style.cursor = starIndexAt(p.x, p.y) !== -1 ? 'grab' : 'default';
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (draggingIndex === -1) return;
      const star = stars[draggingIndex];
      if (reduceMotion) {
        star.vx = 0;
        star.vy = 0;
      } else {
        const speed = Math.hypot(star.vx, star.vy);
        const maxSpeed = 2.5;
        if (speed > maxSpeed) {
          star.vx = (star.vx / speed) * maxSpeed;
          star.vy = (star.vy / speed) * maxSpeed;
        }
      }
      draggingIndex = -1;
      canvas!.releasePointerCapture(e.pointerId);
      canvas!.style.cursor = 'default';
    }

    resize();
    if (reduceMotion) {
      drawFrame(false);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" aria-hidden />;
}
