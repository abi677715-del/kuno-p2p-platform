'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type BannerAd = {
  id: string;
  title: string;
  linkUrl: string;
  videoUrl: string;
};

/**
 * Sponsored video ad slot for a given placement (e.g. "MARKETPLACE",
 * "HOMEPAGE"). Renders nothing if there's nothing approved for that slot,
 * so it never leaves an empty gap in the layout.
 */
export default function BannerAdRow({ placement }: { placement: 'MARKETPLACE' | 'HOMEPAGE' }) {
  const [ads, setAds] = useState<BannerAd[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/banner-ads/active?placement=${placement}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAds(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {});
  }, [placement]);

  if (ads.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 mb-6 -mx-1 px-1" style={{ perspective: '1000px' }}>
      {ads.map((ad) => (
        <VideoAdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

function VideoAdCard({ ad }: { ad: BannerAd }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: y * -12, ry: x * 12 });
  }

  function handleMouseLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative shrink-0 w-64 h-36 rounded-xl overflow-hidden border border-white/10 bg-surface shadow-lg shadow-black/30 transition-transform duration-150 ease-out"
      style={{
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.rx || tilt.ry ? 1.03 : 1})`,
        transformStyle: 'preserve-3d',
      }}
    >
      <video
        src={`${API_URL}${ad.videoUrl}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent pointer-events-none" />
      <span className="absolute top-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted pointer-events-none">
        Sponsored
      </span>
      <p className="absolute bottom-2 left-3 right-3 text-sm font-medium text-paper truncate pointer-events-none">
        {ad.title}
      </p>
    </a>
  );
}
