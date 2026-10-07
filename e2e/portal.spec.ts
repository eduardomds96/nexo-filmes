import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const counter = (page: Page) =>
  page.getByRole('banner').getByRole('link', { name: /^Favoritos(: | \()/ });

test.describe('micro-frontends', () => {
  test('React, React DOM e React Router existem uma única vez na página', async ({ page }) => {
    await page.goto('/filmes');
    await expect(page.getByRole('heading', { level: 1, name: 'Filmes' })).toBeVisible();
    await expect(counter(page)).toHaveAttribute('aria-label', /Favoritos: \d/);

    const loaded = await page.evaluate(() => {
      type Shared = Record<string, Record<string, { from: string; loaded?: boolean }>>;
      const federation = (
        globalThis as { __FEDERATION__?: { __SHARE__: Record<string, Record<string, Shared>> } }
      ).__FEDERATION__;
      const result: Record<string, string[]> = {};
      for (const scopes of Object.values(federation?.__SHARE__ ?? {})) {
        for (const packages of Object.values(scopes)) {
          for (const [name, versions] of Object.entries(packages)) {
            for (const [version, info] of Object.entries(versions)) {
              if (!info.loaded) continue;
              const id = `${version}@${info.from}`;
              result[name] ??= [];
              if (!result[name].includes(id)) result[name].push(id);
            }
          }
        }
      }
      return result;
    });

    for (const name of ['react', 'react-dom', 'react-router', '@nexo/user-data']) {
      expect(loaded[name], name).toHaveLength(1);
      expect(loaded[name]?.[0], name).toMatch(/@shell$/);
    }
  });

  test('se um remote cair, só a área dele mostra erro e "Tentar novamente" recarrega', async ({
    browser,
  }) => {
    // Sem service worker para que o Playwright intercepte as requisições do remote.
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    // Nenhum teste fala com a TMDB real.
    await page.route('https://api.themoviedb.org/**', (route) => route.abort());
    let down = true;
    await page.route('http://localhost:3002/**', (route) =>
      down ? route.abort() : route.continue(),
    );

    await page.goto('/filme/598');
    const main = page.getByRole('main');
    await expect(main.getByRole('alert')).toContainText(
      'Não foi possível carregar o detalhe do filme',
    );
    // O resto do portal continua funcionando.
    await expect(counter(page)).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Painel' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Painel' })).toBeVisible();
    await page.goBack();

    down = false;
    await main.getByRole('button', { name: 'Tentar novamente' }).click();
    // O remote carregou: a área agora é do detalhe do filme (com a TMDB
    // bloqueada, ele mostra o próprio estado de erro e o link de volta ao catálogo).
    await expect(main.getByRole('link', { name: 'Voltar ao catálogo' })).toBeVisible();
    await context.close();
  });
});

test.describe('favoritos', () => {
  test('favoritar no catálogo aparece no detalhe, nos favoritos e no contador sem recarregar', async ({
    page,
  }) => {
    await page.goto('/filmes');
    await expect(counter(page)).toHaveAttribute('aria-label', 'Favoritos: 0 filmes');

    const add = page.getByRole('button', { name: 'Adicionar Cidade de Deus aos favoritos' });
    await add.click();
    const remove = page.getByRole('button', { name: 'Remover Cidade de Deus dos favoritos' });
    await expect(remove).toHaveAttribute('aria-pressed', 'true');
    await expect(remove).toHaveAttribute('aria-busy', 'true');
    await expect(counter(page)).toHaveAttribute('aria-label', 'Favoritos: 1 filme');
    await expect(remove).toHaveAttribute('aria-busy', 'false');

    await page.getByRole('link', { name: 'Cidade de Deus' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cidade de Deus');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(
      page.getByRole('button', { name: 'Remover Cidade de Deus dos favoritos' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await counter(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Seus favoritos' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Cidade de Deus' })).toBeVisible();
  });

  test('favoritar um filme de id terminado em 13 volta atrás e avisa', async ({ page }) => {
    await page.goto('/filmes?q=compadecida');
    const button = page.getByRole('button', { name: /O Auto da Compadecida/ });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await expect(
      page.getByText('Não foi possível salvar "O Auto da Compadecida" nos favoritos.'),
    ).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(counter(page)).toHaveAttribute('aria-label', 'Favoritos: 0 filmes');
  });

  test('sincroniza o contador entre abas', async ({ context }) => {
    const first = await context.newPage();
    const second = await context.newPage();
    await first.goto('/filmes');
    await second.goto('/favoritos');
    await expect(counter(second)).toHaveAttribute('aria-label', 'Favoritos: 0 filmes');

    await first.getByRole('button', { name: 'Adicionar Matrix aos favoritos' }).click();

    await expect(counter(second)).toHaveAttribute('aria-label', 'Favoritos: 1 filme');
    await expect(second.getByRole('heading', { level: 3, name: 'Matrix' })).toBeVisible();
  });
});

test.describe('catálogo', () => {
  test('busca e gênero ficam na URL e sobrevivem ao recarregar', async ({ page }) => {
    await page.goto('/filmes');
    await page.getByLabel('Buscar por título').fill('senhor');
    await expect(page).toHaveURL(/q=senhor/);
    await expect(page.getByRole('status').filter({ hasText: 'encontrados' })).toHaveText(
      '2 filmes encontrados.',
    );

    // O rádio é visualmente oculto: o usuário clica no chip (o rótulo).
    await page
      .locator('label')
      .filter({ hasText: /^Fantasia$/ })
      .click();
    await expect(page).toHaveURL(/q=senhor&genero=14/);

    await page.reload();
    await expect(page.getByLabel('Buscar por título')).toHaveValue('senhor');
    await expect(page.getByRole('radio', { name: 'Fantasia' })).toBeChecked();
    await expect(page.getByText(/não filtra por gênero/)).toBeVisible();
  });

  test('erro 429 mostra mensagem clara e "Tentar novamente"', async ({ page }) => {
    await page.goto('/filmes?q=erro429');
    const alert = page.getByRole('main').getByRole('alert');
    await expect(alert).toContainText('Muitas requisições');
    await expect(alert.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });
});

test.describe('avaliação', () => {
  test('mensagens por campo, foco no primeiro inválido e valores preservados', async ({ page }) => {
    await page.goto('/filme/603');
    const score = page.getByLabel('Nota');
    const comment = page.getByLabel(/Comentário/);
    await comment.fill('x'.repeat(501));
    await page.getByRole('button', { name: 'Salvar avaliação' }).click();

    await expect(page.getByText('Escolha uma nota.')).toBeVisible();
    await expect(page.getByText('O comentário pode ter no máximo 500 caracteres.')).toBeVisible();
    await expect(score).toBeFocused();
    await expect(comment).toHaveValue('x'.repeat(501));

    await score.fill('8,5');
    await comment.fill('Muito bom');
    await page.getByRole('button', { name: 'Salvar avaliação' }).click();
    await expect(page.getByRole('button', { name: 'Atualizar avaliação' })).toBeVisible();

    // A avaliação aparece em "Minhas avaliações", com link de volta ao formulário.
    await page.getByRole('link', { name: 'Ver todas as minhas avaliações' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Minhas avaliações' })).toBeVisible();
    await expect(page.getByText('1 filme avaliado · média 8,5')).toBeVisible();
    await expect(page.getByText('Muito bom')).toBeVisible();
    await page.getByRole('link', { name: 'Editar avaliação de Matrix' }).click();
    await expect(page).toHaveURL(/\/filme\/603#avaliacao$/);
    await expect(page.getByLabel('Nota')).toBeFocused();

    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Painel' })
      .click();
    await expect(page.getByText('8,5', { exact: true })).toBeVisible();
  });
});

test.describe('responsivo e teclado', () => {
  test('nenhuma tela tem rolagem horizontal em 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of [
      '/filmes',
      '/filme/598',
      '/favoritos',
      '/avaliacoes',
      '/painel',
      '/nao-existe',
    ]) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, path).toBe(false);
    }
  });

  test('o primeiro Tab leva ao link "Pular para o conteúdo"', async ({ page }) => {
    await page.goto('/filmes');
    await expect(page.getByRole('heading', { level: 1, name: 'Filmes' })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
});
