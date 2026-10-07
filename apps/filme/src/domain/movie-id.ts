export function parseMovieId(param: string | undefined): number | null {
  if (param === undefined || !/^[1-9]\d{0,9}$/.test(param)) return null;
  const id = Number(param);
  return Number.isSafeInteger(id) ? id : null;
}
