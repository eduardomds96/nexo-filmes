import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/filmes', '/filme/598', '/favoritos', '/avaliacoes', '/painel', '/nao-existe'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`acessibilidade (tema ${colorScheme === 'light' ? 'claro' : 'escuro'})`, () => {
    test.use({ colorScheme });

    for (const path of PAGES) {
      test(`${path} não tem violações WCAG 2.1 AA detectáveis`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // Espera os dados do usuário (atraso simulado) e as imagens.
        await expect(
          page.getByRole('banner').getByRole('link', { name: /^Favoritos: / }),
        ).toBeVisible();
        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();

        expect(
          results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
          })),
        ).toEqual([]);
      });
    }
  });
}
