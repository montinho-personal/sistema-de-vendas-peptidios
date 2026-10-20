/**
 * Ciclo de recompra de um cliente para um produto, em dias.
 *
 * Usa o intervalo observado entre as compras, que reflete o comportamento real.
 * Dois cuidados que o cálculo anterior não tinha:
 *
 * - Intervalos de zero dia são descartados. Duas unidades compradas no mesmo
 *   dia viram duas linhas de venda, e o intervalo zero derrubava o ciclo para
 *   0 — fazendo o cliente constar como atrasado desde a primeira compra.
 * - Sem intervalo utilizável (compra única), vale a duração informada na
 *   própria venda, não um valor fixo de 90 dias. Um produto que dura 30 dias
 *   não deve esperar 90 para gerar alerta.
 *
 * @param datasDesc datas das compras, da mais recente para a mais antiga
 * @param diasDuracaoUltima duração registrada na venda mais recente
 */
export function cicloMedioDias(datasDesc: Date[], diasDuracaoUltima: number): number {
  const intervalos: number[] = []
  for (let i = 0; i < datasDesc.length - 1; i++) {
    const dias = Math.round((datasDesc[i].getTime() - datasDesc[i + 1].getTime()) / 86400000)
    if (dias > 0) intervalos.push(dias)
  }
  if (intervalos.length === 0) return diasDuracaoUltima || 90
  return Math.round(intervalos.reduce((a, b) => a + b, 0) / intervalos.length)
}
