const AD_IMAGE_URL = process.env.NEXT_PUBLIC_AD_IMAGE_URL;
const AD_LINK_URL = process.env.NEXT_PUBLIC_AD_LINK_URL;

export default function AdBanner() {
  if (!AD_IMAGE_URL) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-10">
      <p className="text-[10px] uppercase tracking-wide text-muted mb-2">Advertisement</p>
      <a
        href={AD_LINK_URL || '#'}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AD_IMAGE_URL} alt="Advertisement" className="w-full h-auto" />
      </a>
    </div>
  );
}
