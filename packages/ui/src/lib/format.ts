const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const integer = new Intl.NumberFormat('pt-BR');

/** Nota com uma casa decimal no formato pt-BR (ex.: `7,5`). */
export function formatScore(value: number): string {
  return oneDecimal.format(value);
}

/** Nota do usuário: inteiros sem casa decimal (`8`), meios com vírgula (`7,5`). */
export function formatUserScore(value: number): string {
  return Number.isInteger(value) ? integer.format(value) : oneDecimal.format(value);
}

export function formatCount(value: number): string {
  return integer.format(value);
}

/** Duração em minutos como `2h 19min`, `45min` ou `2h`. */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${String(rest)}min`;
  if (rest === 0) return `${String(hours)}h`;
  return `${String(hours)}h ${String(rest)}min`;
}

/** Duração por extenso, para leitores de tela (ex.: `2 horas e 19 minutos`). */
export function formatRuntimeLong(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${String(hours)} ${hours === 1 ? 'hora' : 'horas'}`);
  if (rest > 0) parts.push(`${String(rest)} ${rest === 1 ? 'minuto' : 'minutos'}`);
  return parts.join(' e ') || '0 minutos';
}

/** Pluralização simples em pt-BR. */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatCount(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Iniciais de um nome (primeira e última palavra), para avatares sem foto. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return (first + last).toLocaleUpperCase('pt-BR');
}
