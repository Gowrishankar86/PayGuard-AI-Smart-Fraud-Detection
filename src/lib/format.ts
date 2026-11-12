const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

export function formatDateTime(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
