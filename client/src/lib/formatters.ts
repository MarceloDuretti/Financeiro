export function formatCompanyCode(code: number): string {
  return `EMP${code.toString().padStart(3, '0')}`;
}

export function formatCategoryCode(code: number, type: 'receita' | 'despesa'): string {
  const prefix = type === 'receita' ? 'REC' : 'DES';
  return `${prefix}${code.toString().padStart(3, '0')}`;
}
