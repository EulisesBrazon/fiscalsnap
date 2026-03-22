export function buildVoucherNumber(date: Date, correlative: number): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const serial = String(correlative).padStart(6, "0");
  return `${year}${month}${serial}`;
}
