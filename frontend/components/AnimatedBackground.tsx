'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight canvas particle-network animation (no 3D/WebGL library) — nodes
 * drifting and linking when close, echoing "peer-to-peer" without the bundle
 * size or low-end-mobile risk a real 3D engine would add.
 */
export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ['#E8A33D', '#0B8457'];

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: { x: number; y: number; vx: number; vy: number; r: number; color: string }[] = [];
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

      const density = width < 640 ? 22000 : 14000;
      const count = Math.min(70, Math.max(18, Math.round((width * height) / density)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.8,
        color: colors[Math.random() < 0.5 ? 0 : 1],
      }));
    }

    function drawStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color + '55';
        ctx!.fill();
      }
    }

    function tick() {
      if (!running) return;
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      const linkDist = width < 640 ? 90 : 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            const alpha = (1 - dist / linkDist) * 0.15;
            ctx!.strokeStyle = `rgba(150, 176, 160, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color + '99';
        ctx!.fill();
      }

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
      drawStatic();
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
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-70"
      aria-hidden
    />
  );
}
