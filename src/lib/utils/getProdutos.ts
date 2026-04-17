// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProdutoLabel(data: any[] | null): Record<string, string> {
  return Object.fromEntries((data ?? []).map(p => [p.value, p.label]))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProdutoCurto(data: any[] | null): Record<string, string> {
  return Object.fromEntries((data ?? []).map(p => [p.value, p.curto]))
}
