// @ts-check
/**
 * Plugin PostCSS que confina os utilitários de um remote ao contêiner dele.
 *
 * Cada remote gera o próprio CSS com Tailwind. Sem isolamento, um utilitário
 * declarado de novo por um remote (ex.: `.w-full`) chega depois do CSS do
 * Shell e vence variantes responsivas do Shell (ex.: `sm:w-auto`) no
 * cabeçalho. Aqui o conteúdo de `@layer utilities` é envolvido em
 * `@scope ([data-nexo-remote="<nome>"])`: as regras do remote só valem dentro
 * da área que o Shell reservou para ele. Variáveis de tema e `@property`
 * continuam globais. Ver docs/adr/0004.
 *
 * @param {{ remote: string; include: RegExp }} options
 * @returns {import('postcss').Plugin}
 */
export function scopeRemoteUtilities({ remote, include }) {
  const selector = `[data-nexo-remote="${remote}"]`;
  return {
    postcssPlugin: 'nexo-scope-remote-utilities',
    Once(root, { AtRule }) {
      const file = root.source?.input.file ?? '';
      if (!include.test(file.replaceAll('\\', '/'))) return;

      root.walkAtRules('layer', (layer) => {
        if (layer.params !== 'utilities' || !layer.nodes || layer.nodes.length === 0) return;
        const scope = new AtRule({ name: 'scope', params: `(${selector})` });
        scope.append(layer.nodes);
        layer.append(scope);
      });
    },
  };
}

/** Atributo que o Shell (e o mini-shell) coloca no contêiner do remote. */
export const REMOTE_SCOPE_ATTRIBUTE = 'data-nexo-remote';
