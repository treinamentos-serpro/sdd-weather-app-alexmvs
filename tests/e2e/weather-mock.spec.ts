import { expect, test } from '@playwright/test';

test('layout mock de Salvador e alternância de unidades sem rolagem horizontal', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Como está o clima?' })).toBeVisible();
  await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Salvador' })).toHaveCount(0);
  await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
  await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: 'Graus Fahrenheit' }).click();
  await expect(page.getByText('77,7 °F', { exact: true })).toBeVisible();
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);

  await page.getByLabel('Cenário da previsão').selectOption('loading');
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByLabel('Cenário da previsão').selectOption('error');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Graus Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('teclado mantém foco e anuncia resultados sem mover o foco da busca', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByLabel('Cidade', { exact: true })).toBeFocused();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
  await page.getByRole('option', { name: /Salvador.*Bahia/ }).waitFor();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Cidade', { exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();

  await page.getByLabel('Cenário das condições').selectOption('error');
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Seção: Condições meteorológicas' })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();
});

test('homônimos, Escape, parcial e retry isolado sem chamadas à API', async ({ page }) => {
  let weatherRequests = 0;
  await page.route(/https:\/\/.*open-meteo\.com\//, async (route) => {
    weatherRequests++;
    await route.abort();
  });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('12,4 °C', { exact: true })).toBeVisible();
  await page.getByLabel('Cenário das condições').selectOption('timeout');
  await page.getByLabel('Cenário da previsão').selectOption('partial');
  await expect(page.getByRole('listitem')).toHaveCount(5);
  await expect(page.getByText('Indisponível', { exact: true })).toHaveCount(5);
  await expect(page.getByText('Condição: Indisponível')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('12,4 °C', { exact: true })).toBeVisible();
  await expect(page.getByText('Indisponível', { exact: true })).toHaveCount(5);
  await expect(page.getByText('Condição: Indisponível')).toBeVisible();
  await page.getByLabel('Cidade', { exact: true }).fill('Outro local');
  await expect(page.getByRole('region', { name: 'Salvador' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(weatherRequests).toBe(0);
});

test('texto dos botões mantém contraste AA, inclusive ao passar o mouse', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Buscar', 'Graus Celsius', 'Graus Fahrenheit']) {
    const button = page.getByRole('button', { name, exact: true });
    for (const hover of [false, true]) {
      if (hover) await button.hover();
      const ratio = await button.evaluate((element) => {
        function luminance(channels: number[]) {
          return channels.reduce((sum, channel, index) => {
            const value = channel / 255;
            const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            return sum + linear * [0.2126, 0.7152, 0.0722][index];
          }, 0);
        }
        const style = getComputedStyle(element);
        const layers: number[][] = [];
        let current: Element | null = element;
        while (current) {
          layers.push(
            getComputedStyle(current)
              .backgroundColor.match(/[\d.]+/g)!
              .map(Number),
          );
          current = current.parentElement;
        }
        let background = [255, 255, 255];
        for (const layer of layers.reverse()) {
          const alpha = layer[3] ?? 1;
          background = background.map(
            (channel, index) => layer[index] * alpha + channel * (1 - alpha),
          );
        }
        const foregroundLuminance = luminance(
          style.color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number),
        );
        const backgroundLuminance = luminance(background);
        return (
          (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
          (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
        );
      });
      expect(ratio, `${name}, hover=${hover}`).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0, 0);
    }
  }
});

test('busca distingue loading, vazio, inválido, erro e timeout e recupera pelo teclado', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
  for (const scenario of ['loading', 'empty', 'invalid', 'error', 'timeout']) {
    await page.getByLabel('Cenário da busca').selectOption(scenario);
    if (scenario === 'loading') {
      await expect(page.getByRole('status')).toHaveText('Buscando cidades...');
    } else if (scenario === 'empty' || scenario === 'invalid') {
      await expect(
        page.getByRole('heading', {
          name:
            scenario === 'invalid'
              ? 'Não foi possível identificar a cidade'
              : 'Nenhuma cidade encontrada',
        }),
      ).toBeVisible();
    } else {
      await expect(page.getByRole('alert')).toContainText(
        scenario === 'timeout'
          ? 'Tempo limite excedido: Busca de cidades'
          : 'Falha: Busca de cidades',
      );
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByLabel('Cidade', { exact: true })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Salvador' })).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Tentar novamente' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Cidade', { exact: true })).toBeFocused();
  await expect(page.getByRole('option', { name: /Salvador.*Bahia/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Salvador' })).toHaveCount(0);
});

for (const width of [320, 375, 640, 768, 1024, 1440]) {
  test(`cenários sem transbordamento em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    for (const scenario of ['loading', 'empty', 'partial', 'error', 'timeout', 'success']) {
      await page.getByLabel('Cenário da previsão').selectOption(scenario);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Cenário ${scenario} em ${width}px`,
      ).toBe(true);
    }

    await page.getByLabel('Cenário da previsão').selectOption('success');
    const columns = await page
      .getByRole('list')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);

    await page.getByLabel('Cidade', { exact: true }).fill('Cidade'.repeat(30));
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      'Mensagem de busca longa',
    ).toBe(true);
  });
}
