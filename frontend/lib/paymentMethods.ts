export const PAYMENT_METHODS = [
  { label: 'Telebirr', initials: 'TB', color: '#F59E0B' },
  { label: 'CBE', initials: 'CBE', color: '#7C3AED' },
  { label: 'Dashen Bank', initials: 'DB', color: '#2563EB' },
  { label: 'Awash Bank', initials: 'AB', color: '#DC2626' },
  { label: 'Bank of Abyssinia', initials: 'BOA', color: '#CA8A04' },
  { label: 'Wegagen Bank', initials: 'WB', color: '#0D9488' },
  { label: 'Zemen Bank', initials: 'ZB', color: '#1E3A8A' },
  { label: 'Nib International Bank', initials: 'NIB', color: '#16A34A' },
  { label: 'Cooperative Bank of Oromia', initials: 'CBO', color: '#EA580C' },
  { label: 'Hibret Bank', initials: 'HB', color: '#334155' },
];

export function colorFor(label: string): string {
  return PAYMENT_METHODS.find((m) => m.label === label)?.color ?? '#475569';
}

export function initialsFor(label: string): string {
  return PAYMENT_METHODS.find((m) => m.label === label)?.initials ?? label.slice(0, 2).toUpperCase();
}
