/** Converte o parâmetro `:id` da rota em id de filme. Qualquer coisa inválida vira `null`. */
export function parseMovieId(param: string | undefined): number | null {
  if (param === undefined || !/^[1-9]\d{0,9}$/.test(param)) return null;
  const id = Number(param);
  return Number.isSafeInteger(id) ? id : null;
}
