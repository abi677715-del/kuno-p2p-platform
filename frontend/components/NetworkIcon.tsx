// Simplified vector recreations of each chain's mark, redrawn from what was
// shared in chat (not extracted logo files — this environment can't save
// pasted images to disk) so no binary assets are needed at all.

function Tron() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#EB0029" />
      <path
        d="M9 9 L24 11 L20 15.5 L13.5 23.5 L7 12.5 Z M9 9 L13.5 23.5 M9 9 L20 15.5"
        fill="none"
        stroke="white"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Ethereum() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#343434" />
      <polygon points="16,4 25,16.5 16,21.5 7,16.5" fill="#8C8C8C" />
      <polygon points="16,4 16,21.5 25,16.5" fill="#3C3C3B" />
      <polygon points="7,18 16,28 16,23.2" fill="#8C8C8C" />
      <polygon points="16,23.2 16,28 25,18" fill="#141414" />
      <polygon points="7,16.5 16,21.5 16,14.5" fill="#393939" />
      <polygon points="16,14.5 16,21.5 25,16.5" fill="#2F2F2F" />
    </svg>
  );
}

function Bnb() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#0B0E11" />
      <g fill="#F0B90B">
        <polygon points="16,7.5 19.5,11 16,14.5 12.5,11" />
        <polygon points="9,14.5 11,16.5 9,18.5 7,16.5" />
        <polygon points="23,14.5 25,16.5 23,18.5 21,16.5" />
        <polygon points="16,17.5 19.5,21 16,24.5 12.5,21" />
        <polygon points="16,14.5 18,16.5 16,18.5 14,16.5" />
      </g>
    </svg>
  );
}

function Polygon() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#8247E5" />
      <path
        d="M20 11.3c-.4-.2-.9-.2-1.3 0l-2.9 1.7-2 1.1-2.9 1.7c-.4.2-.9.2-1.3 0l-2.3-1.4a1.3 1.3 0 0 1-.6-1.1v-2.7c0-.4.2-.9.6-1.1l2.3-1.3c.4-.2.9-.2 1.3 0l2.3 1.3c.4.2.6.6.6 1.1v1.7l2-1.2v-1.7c0-.4-.2-.9-.6-1.1l-4.2-2.4c-.4-.2-.9-.2-1.3 0l-4.3 2.4c-.4.2-.6.6-.6 1.1v4.8c0 .4.2.9.6 1.1l4.3 2.4c.4.2.9.2 1.3 0l2.9-1.6 2-1.2 2.9-1.6c.4-.2.9-.2 1.3 0l2.3 1.3c.4.2.6.6.6 1.1v2.7c0 .4-.2.9-.6 1.1l-2.3 1.4c-.4.2-.9.2-1.3 0l-2.3-1.3a1.3 1.3 0 0 1-.6-1.1v-1.7l-2 1.2v1.7c0 .4.2.9.6 1.1l4.3 2.4c.4.2.9.2 1.3 0l4.3-2.4c.4-.2.6-.6.6-1.1v-4.8c0-.4-.2-.9-.6-1.1z"
        fill="white"
      />
    </svg>
  );
}

function Arbitrum() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#2D374B" />
      <polygon points="16,7 24,11.5 24,20.5 16,25 8,20.5 8,11.5" fill="none" stroke="#9DCCED" strokeWidth="1" />
      <path d="M13.5 21 L16.5 11.5 L18 15.5 L15 21 Z" fill="white" />
      <path d="M18.5 21 L20.3 15.8 L22 21 Z" fill="#28A0F0" />
    </svg>
  );
}

function Optimism() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#FF0420" />
      <text x="16" y="20.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="Arial, Helvetica, sans-serif">
        OP
      </text>
    </svg>
  );
}

function Solana() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <defs>
        <linearGradient id="solGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00FFA3" />
          <stop offset="1" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <g fill="url(#solGrad)">
        <polygon points="9,11 23,11 20,14 6,14" />
        <polygon points="6,16 20,16 23,19 9,19" />
        <polygon points="9,21 23,21 20,24 6,24" />
      </g>
    </svg>
  );
}

function Ton() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <circle cx="16" cy="16" r="16" fill="#0088CC" />
      <path
        d="M9.5 10h13a1.8 1.8 0 0 1 1.5 2.8l-6.5 11.2a1.8 1.8 0 0 1-3.1 0L8 12.8A1.8 1.8 0 0 1 9.5 10z"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
      />
      <path d="M16 10v14.5M9.6 10.7l6.4 3.6M22.4 10.7l-6.4 3.6" stroke="white" strokeWidth="1" fill="none" />
    </svg>
  );
}

const ICONS: Record<string, () => JSX.Element> = {
  TRC20: Tron,
  ERC20: Ethereum,
  BEP20: Bnb,
  POLYGON: Polygon,
  ARBITRUM: Arbitrum,
  OPTIMISM: Optimism,
  SOLANA: Solana,
  TON: Ton,
};

export function NetworkIcon({ network }: { network: string }) {
  const Icon = ICONS[network];
  if (!Icon) return null;
  return <Icon />;
}
