'use client';

import { useState } from 'react';
import { apiUpload } from '@/lib/api';

const PLACEMENTS: { value: 'MARKETPLACE' | 'HOMEPAGE'; label: string; description: string }[] = [
  { value: 'MARKETPLACE', label: 'Marketplace', description: 'Where traders browse buy/sell offers' },
  { value: 'HOMEPAGE', label: 'Homepage', description: 'The landing page before login' },
];

export default function AdvertisePage() {
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserEmail, setAdvertiserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [placements, setPlacements] = useState<string[]>(['MARKETPLACE']);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function togglePlacement(value: string) {
    setPlacements((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!video) {
      setError('Attach a video file (mp4, webm, or mov).');
      return;
    }
    if (placements.length === 0) {
      setError('Pick at least one placement.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('advertiserName', advertiserName);
      formData.append('advertiserEmail', advertiserEmail);
      formData.append('title', title);
      formData.append('linkUrl', linkUrl);
      formData.append('placements', JSON.stringify(placements));
      formData.append('video', video);
      await apiUpload('/banner-ads/submit', formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-ink px-6 py-10 md:px-12 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="font-display font-bold text-2xl text-paper mb-3">Submission received</h1>
          <p className="text-muted text-sm">
            Thanks — we'll review your video ad and email you at {advertiserEmail || 'the address you gave'} once
            it's approved and live.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-2">Advertise on Birrly</h1>
        <p className="text-muted text-sm mb-6">
          Submit a short video ad. Every submission is reviewed before it goes live — no account needed.
        </p>

        <form onSubmit={handleSubmit} className="bg-surface border border-white/10 rounded-xl p-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted block mb-1">Your name / business name</span>
            <input
              value={advertiserName}
              onChange={(e) => setAdvertiserName(e.target.value)}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted block mb-1">Contact email</span>
            <input
              type="email"
              value={advertiserEmail}
              onChange={(e) => setAdvertiserEmail(e.target.value)}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted block mb-1">Ad title (shown on the card)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted block mb-1">Link (where a click should take people)</span>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              required
              className="w-full bg-surfaceRaised rounded-md px-3 py-2 text-paper outline-none focus:ring-2 focus:ring-teal"
            />
          </label>

          <div>
            <span className="text-xs text-muted block mb-2">Where should this ad appear?</span>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map((p) => {
                const active = placements.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlacement(p.value)}
                    className={`text-left rounded-md border p-3 transition-colors ${
                      active ? 'border-transparent bg-gradient-to-br from-gold/20 to-teal/20 ring-1 ring-teal' : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <p className="text-sm font-medium text-paper">{p.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">{p.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="text-xs text-muted block mb-1">Video file (mp4, webm, or mov — up to 40MB)</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-paper file:mr-3 file:rounded-md file:border-0 file:bg-surfaceRaised file:px-3 file:py-2 file:text-paper"
            />
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gradient-to-br from-gold to-teal py-2 text-onaccent font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Uploading…' : 'Submit for review'}
          </button>
        </form>
      </div>
    </main>
  );
}
