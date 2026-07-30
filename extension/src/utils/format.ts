export function formatCurrency(value: number | null, currency = 'INR'): string {
  if (value === null) return '—'
  const symbol = currency === 'USD' ? '$' : '₹'
  return `${symbol}${value.toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN')}`
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function riskLabel(level: 'safe' | 'caution' | 'danger'): string {
  switch (level) {
    case 'safe':
      return 'Verified Genuine'
    case 'caution':
      return 'Proceed with Caution'
    case 'danger':
      return 'High Counterfeit Risk'
  }
}
