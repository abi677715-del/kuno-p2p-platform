/** Quotes a CSV field if it contains a comma, quote, or newline; doubles any embedded quotes. */
export function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
