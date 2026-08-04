@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'Times New Roman', Times, serif;
}

body {
  background-color: #0f1420;
  background-image: linear-gradient(135deg, rgba(194, 163, 63, 0.34) 0%, #0f1420 42%, #0f1420 58%, rgba(75, 144, 78, 0.38) 100%);
  background-attachment: fixed;
  color: #f2f1ec;
}

/* Every page's <main> paints its own bg-ink over the body, so the logo's
   gold-to-teal diagonal is repeated here too, keeping it visible everywhere. */
.bg-ink {
  background-color: #0f1420;
  background-image: linear-gradient(135deg, rgba(194, 163, 63, 0.34) 0%, #0f1420 42%, #0f1420 58%, rgba(75, 144, 78, 0.38) 100%);
  background-attachment: fixed;
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-4%, 3%) scale(1.06); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-float-orb {
  animation: float-orb 14s ease-in-out infinite;
}

.animate-fade-in-up {
  animation: fade-in-up 0.7s ease-out both;
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.reveal-in {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
  .reveal {
    opacity: 1;
    transform: none;
  }
}
