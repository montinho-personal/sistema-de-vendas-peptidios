/**
 * As datas de venda são colunas `date` no banco: representam um dia do calendário,
 * não um instante no tempo. O Prisma as serializa como meia-noite UTC
 * ("2026-09-01T00:00:00.000Z"), então convertê-las para o fuso local (UTC-3)
 * jogaria o dia para trás. Estas funções trabalham sempre com a parte de
 * calendário da string, sem passar pelo fuso do navegador.
 */

/** Aceita "YYYY-MM-DD" ou ISO completo e devolve sempre "YYYY-MM-DD". */
export function toDateStr(value: string): string {
  return value.slice(0, 10)
}

/** Formata como DD/MM/AAAA sem deslocamento de fuso. */
export function formatBR(value: string): string {
  const [ano, mes, dia] = toDateStr(value).split('-')
  return `${dia}/${mes}/${ano}`
}

/** Data de hoje no fuso local, como "YYYY-MM-DD". */
export function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Soma dias a uma data de calendário. Meio-dia evita qualquer efeito de fuso/DST. */
export function addDays(value: string, days: number): string {
  const d = new Date(toDateStr(value) + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MESES = ['Janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** Extrai mês (nome) e ano de uma data de calendário. */
export function getMesAno(value: string) {
  const [ano, mes] = toDateStr(value).split('-')
  return { mes: MESES[Number(mes) - 1], ano: Number(ano) }
}
