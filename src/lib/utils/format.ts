export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatTon(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value) + ' t'
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(
    typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  )
}

export function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const diff = today.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function parseBrazilianNumber(str: string): number {
  // Converte "1.234,56" para 1234.56
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}
