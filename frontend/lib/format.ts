/** Formats a numeric amount with thousand separators, e.g. 6170 -> "6,170". */
export function formatAmount(value: string | number, maxDecimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
}
