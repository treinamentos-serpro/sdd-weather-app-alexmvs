import { expect, test } from '@playwright/test';
import { city, forecastResponse, mockWeatherApi } from './helpers/weatherApi';

test('três letras/300 ms listam cidades e enviar não seleciona automaticamente', async ({
  page,
}) => {
  const calls = await mockWeatherApi(page);
  await page.goto('/');
  await page.clock.pauseAt(new Date('2026-10-27T18:01:00Z'));
  const input = page.getByLabel('Cidade', { exact: true });
  await input.fill('Sa');
  await page.clock.runFor(1000);
  expect(calls.search).toBe(0);
  await input.fill('Sal');
  await page.clock.runFor(299);
  expect(calls.search).toBe(0);
  await page.clock.runFor(1);
  await expect(page.getByRole('option', { name: /Salvador.*Bahia/ })).toBeVisible();
  expect(calls).toEqual({ search: 1, current: 0, forecast: 0 });
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Resultado da busca' })).toContainText(
    'Selecione uma sugestão',
  );
  expect(calls.current).toBe(0);
  expect(calls.forecast).toBe(0);
});

test('seleciona segundo homônimo pelas coordenadas e converte sem nova rede', async ({ page }) => {
  const calls = await mockWeatherApi(page);
  await page.goto('/');
  await expect(page.getByRole('complementary')).toContainText('nome pesquisado é enviado');
  await page.getByLabel('Cidade', { exact: true }).fill('Sal');
  await expect(page.getByRole('option', { name: /Outra região/ })).toBeVisible();
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/')) requests.push(request.url());
  });
  await page.getByLabel('Cidade', { exact: true }).press('ArrowDown');
  await page.getByLabel('Cidade', { exact: true }).press('ArrowDown');
  await page.getByLabel('Cidade', { exact: true }).press('Enter');
  await expect(page.getByRole('region', { name: 'Salvador' })).toContainText('Outra região');
  await expect(page.getByText('12,4 °C', { exact: true })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  for (const date of forecastResponse.daily.time) {
    await expect(page.locator(`time[datetime="${date}"]`)).toHaveCount(1);
  }
  expect(requests).toHaveLength(2);
  expect(requests.every((url) => new URL(url).searchParams.get('latitude') === '10')).toBe(true);
  const before = { ...calls };
  await page.getByRole('button', { name: 'Graus Fahrenheit' }).click();
  await expect(page.getByText('54,3 °F', { exact: true })).toBeVisible();
  expect(calls).toEqual(before);
  await page.getByLabel('Cidade', { exact: true }).fill('Sa');
  await expect(page.getByRole('heading', { name: 'Como está o clima?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Graus Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('Escape fecha sugestões e foco da busca é preservado na seleção', async ({ page }) => {
  await mockWeatherApi(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Weather App', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const input = page.getByLabel('Cidade', { exact: true });
  await input.fill('Sal');
  await expect(page.getByRole('listbox')).toBeVisible();
  await input.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();
  await expect(input).toBeFocused();
});

for (const operation of ['current', 'forecast'] as const) {
  test(`erro e retry de ${operation} preservam outra seção`, async ({ page }) => {
    const calls = await mockWeatherApi(page);
    let attempts = 0;
    await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
      const current = new URL(route.request().url()).searchParams.has('current');
      if (current !== (operation === 'current')) {
        await route.fallback();
        return;
      }
      attempts++;
      await route.fulfill(attempts === 1 ? { status: 500, json: {} } : { json: forecastResponse });
    });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Sal');
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    const failed = page.getByRole('region', {
      name: operation === 'current' ? 'Seção: Condições meteorológicas' : 'Seção: Previsão diária',
    });
    await expect(failed.getByRole('alert')).toContainText('HTTP 500');
    await expect(
      page.getByRole('region', {
        name: operation === 'current' ? 'Previsão diária' : 'Salvador',
        exact: true,
      }),
    ).toBeVisible();
    const before = { ...calls };
    await failed.getByRole('button', { name: 'Tentar novamente' }).focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('region', {
        name: operation === 'current' ? 'Salvador' : 'Previsão diária',
        exact: true,
      }),
    ).toBeVisible();
    await expect(failed).toBeFocused();
    expect(calls).toEqual(before);
    expect(attempts).toBe(2);
  });
}

for (const operation of ['search', 'current', 'forecast'] as const) {
  test(`timeout de 5 s e resposta tardia de ${operation} não substituem retry`, async ({
    page,
  }) => {
    await mockWeatherApi(page);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let attempts = 0;
    let lateResponseCompleted = false;
    const pattern =
      operation === 'search'
        ? 'https://geocoding-api.open-meteo.com/v1/search?**'
        : 'https://api.open-meteo.com/v1/forecast?**';
    await page.route(pattern, async (route) => {
      if (operation !== 'search') {
        const isCurrent = new URL(route.request().url()).searchParams.has('current');
        if (isCurrent !== (operation === 'current')) {
          await route.fallback();
          return;
        }
      }
      attempts++;
      if (attempts === 1) {
        await pending;
        await route.fulfill({
          json:
            operation === 'search'
              ? { results: [{ ...city, name: 'Antiga' }] }
              : {
                  ...forecastResponse,
                  current: { ...forecastResponse.current, temperature_2m: -99 },
                },
        });
        lateResponseCompleted = true;
      } else {
        await route.fulfill({
          json: operation === 'search' ? { results: [city] } : forecastResponse,
        });
      }
    });
    await page.goto('/');
    const request = page.waitForRequest((req) =>
      operation === 'search'
        ? req.url().startsWith('https://geocoding-api.open-meteo.com/')
        : req.url().startsWith('https://api.open-meteo.com/') &&
          new URL(req.url()).searchParams.has(operation === 'current' ? 'current' : 'daily'),
    );
    await page.getByLabel('Cidade', { exact: true }).fill('Sal');
    if (operation !== 'search') await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    await request;
    if (operation !== 'search') {
      await expect(
        page.getByRole('region', {
          name: operation === 'current' ? 'Previsão diária' : 'Salvador',
          exact: true,
        }),
      ).toBeVisible();
    }
    await page.clock.fastForward(5000);
    await expect(page.getByRole('alert')).toContainText('Tempo limite excedido');
    if (operation !== 'search')
      await expect(
        page.getByRole('region', {
          name: operation === 'current' ? 'Previsão diária' : 'Salvador',
          exact: true,
        }),
      ).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    if (operation === 'search')
      await expect(page.getByRole('region', { name: 'Resultado da busca' })).toContainText(
        '1 localidades',
      );
    else
      await expect(
        page.getByRole('region', {
          name: operation === 'current' ? 'Salvador' : 'Previsão diária',
          exact: true,
        }),
      ).toBeVisible();
    release();
    await expect.poll(() => lateResponseCompleted).toBe(true);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('-99,0 °C', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: /Antiga/ })).toHaveCount(0);
    expect(attempts).toBe(2);
  });
}

test('vazio, rede e candidatos inválidos são distintos e não consultam clima', async ({ page }) => {
  const calls = await mockWeatherApi(page);
  let mode = 'network';
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    if (mode === 'network') await route.abort('failed');
    else await route.fulfill({ json: mode === 'empty' ? {} : { results: [{}] } });
  });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Sal');
  await expect(page.getByRole('alert')).toContainText('Falha de rede');
  mode = 'empty';
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  mode = 'invalid';
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('alert')).toContainText(/identificar|inválid/);
  expect(calls.current).toBe(0);
  expect(calls.forecast).toBe(0);
});

test('previsão parcial preserva cinco datas e condições atuais', async ({ page }) => {
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    if (!new URL(route.request().url()).searchParams.has('daily')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      json: {
        ...forecastResponse,
        daily: { ...forecastResponse.daily, temperature_2m_min: [null] },
      },
    });
  });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Sal');
  await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
  await expect(page.getByRole('listitem')).toHaveCount(5);
  await expect(page.getByText('Previsão diária: dados parcialmente disponíveis.')).toHaveCount(1);
  await expect(
    page
      .getByRole('region', { name: 'Previsão diária', exact: true })
      .getByText('Indisponível', { exact: true }),
  ).toHaveCount(5);
  await expect(page.getByText('25,4 °C', { exact: true })).toBeVisible();
});

test('editar cancela clima em andamento e uma resposta obsoleta não reaparece', async ({
  page,
}) => {
  const calls = await mockWeatherApi(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started = 0;
  let completed = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    started++;
    await pending;
    await route.fulfill({ json: forecastResponse });
    completed++;
  });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Sal');
  await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
  await expect(page.getByRole('status')).toHaveCount(2);
  await expect.poll(() => started).toBe(2);
  await page.getByLabel('Cidade', { exact: true }).fill('Sa');
  release();
  await expect.poll(() => completed).toBe(2);
  await expect(page.getByRole('heading', { name: 'Como está o clima?' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Salvador' })).toHaveCount(0);
  await expect(page.getByRole('listitem')).toHaveCount(0);
  expect(calls.current).toBe(0);
});

for (const operation of ['current', 'forecast'] as const) {
  test(`dados totalmente indisponíveis de ${operation} não são sucesso vazio`, async ({ page }) => {
    await mockWeatherApi(page);
    await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
      const current = new URL(route.request().url()).searchParams.has('current');
      if (current !== (operation === 'current')) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        json: {
          ...forecastResponse,
          [operation === 'current' ? 'current' : 'daily']:
            operation === 'current' ? {} : { time: forecastResponse.daily.time },
        },
      });
    });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Sal');
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    await expect(
      page.getByRole('heading', {
        name:
          operation === 'current'
            ? 'Dados indisponíveis: Condições meteorológicas'
            : 'Dados indisponíveis: Previsão diária',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', {
        name: operation === 'current' ? 'Previsão diária' : 'Salvador',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });
}

test('contraste de texto dos botões mantém AA com e sem hover', async ({ page }) => {
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
        const foreground = luminance(
          getComputedStyle(element)
            .color.match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number),
        );
        const back = luminance(background);
        return (Math.max(foreground, back) + 0.05) / (Math.min(foreground, back) + 0.05);
      });
      expect(ratio, `${name}, hover=${hover}`).toBeGreaterThanOrEqual(4.5);
      await page.mouse.move(0, 0);
    }
  }
});

for (const width of [320, 375, 640, 768, 1024, 1440]) {
  test(`layout sem transbordamento em ${width}px`, async ({ page }) => {
    await mockWeatherApi(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Sal');
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    await expect(page.getByRole('listitem')).toHaveCount(5);
    const columns = await page
      .getByRole('list')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 5 : width >= 640 ? 3 : 2);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByLabel('Cidade', { exact: true }).fill('Cidade'.repeat(30));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
