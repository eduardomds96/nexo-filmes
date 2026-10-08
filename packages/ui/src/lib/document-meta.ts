export const APP_DESCRIPTION =
  'Explore filmes populares, busque por título e gênero, guarde seus favoritos e avalie o que assistiu.';

/** Buscadores costumam exibir até ~160 caracteres da descrição. */
export const META_DESCRIPTION_MAX_LENGTH = 160;

/** Encurta o texto no limite de uma palavra, com reticências, para caber na descrição. */
export function toMetaDescription(text: string, max = META_DESCRIPTION_MAX_LENGTH): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

function metaTag(name: string): HTMLMetaElement {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.append(tag);
  }
  return tag;
}

export function setMetaDescription(description: string): void {
  metaTag('description').content = description;
}

/** Páginas pessoais e de erro não devem ser indexadas. */
export function setNoIndex(noIndex: boolean): void {
  if (noIndex) {
    metaTag('robots').content = 'noindex';
  } else {
    document.head.querySelector('meta[name="robots"]')?.remove();
  }
}
