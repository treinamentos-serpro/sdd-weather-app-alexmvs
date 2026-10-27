import { expect, type Page, test } from '@playwright/test';
import { city, forecastResponse, mockWeatherApi } from './helpers/weatherApi';

async function searchAndSelectCity(page: Page) {
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('option', { name: 'Salvador, Bahia, Brasil', exact: true }).click();
}

async function expectWeatherAndConversion(page: Page) {
  const current = page.getByRole('region', { name: city.name, exact: true });
  const forecast = page.getByRole('region', { name: 'Previsão diária', exact: true });
  await expect(current.getByRole('heading', { name: city.name, exact: true })).toBeVisible();
  await expect(current).toContainText('25,4 °C');
  await expect(forecast).toBeVisible();
  const days = forecast.getByRole('listitem');
  await expect(days).toHaveCount(5);

  await page.getByRole('button', { name: 'Graus Fahrenheit', exact: true }).click();
  await expect(current).toContainText('77,7 °F');
  for (const [index, temperatures] of [
    ['68,0 °F', '80,6 °F'],
    ['69,8 °F', '82,4 °F'],
    ['71,6 °F', '84,2 °F'],
    ['73,4 °F', '86,0 °F'],
    ['75,2 °F', '87,8 °F'],
  ].entries()) {
    for (const temperature of temperatures) {
      await expect(days.nth(index)).toContainText(temperature);
    }
  }
  await expect(forecast).not.toContainText('°C');
  await page.getByRole('button', { name: 'Graus Celsius', exact: true }).click();
  await expect(current).toContainText('25,4 °C');
  await expect(forecast).not.toContainText('°F');
}

test('busca, seleciona cidade e converte clima atual e cinco dias sem nova rede', async ({
  page,
}) => {
  const calls = await mockWeatherApi(page);
  await searchAndSelectCity(page);
  await expectWeatherAndConversion(page);
  expect(calls.current).toBe(1);
  expect(calls.forecast).toBe(1);
});

test('geocoding sem results informa que nenhuma cidade foi encontrada', async ({ page }) => {
  const calls = await mockWeatherApi(page);
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
    await route.fulfill({ json: {} });
  });
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('Inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(0);
  expect(calls.current).toBe(0);
  expect(calls.forecast).toBe(0);
});

test('busca e conversão funcionam no viewport mobile de 375x812', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const calls = await mockWeatherApi(page);
  await searchAndSelectCity(page);
  await expectWeatherAndConversion(page);
  expect(calls.current).toBe(1);
  expect(calls.forecast).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

for (const section of ['current', 'daily'] as const) {
  test(`resposta sem ${section} mostra erro e retry preserva a outra seção`, async ({ page }) => {
    const calls = await mockWeatherApi(page);
    let attempts = 0;
    await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
      if (!new URL(route.request().url()).searchParams.has(section)) {
        await route.fallback();
        return;
      }
      attempts++;
      const body = { ...forecastResponse };
      await route.fulfill({
        json: attempts === 1 ? { ...body, [section]: undefined } : body,
      });
    });
    await searchAndSelectCity(page);
    const failed = page.getByRole('region', {
      name: section === 'current' ? 'Seção: Condições meteorológicas' : 'Seção: Previsão diária',
      exact: true,
    });
    const preserved = page.getByRole('region', {
      name: section === 'current' ? 'Previsão diária' : city.name,
      exact: true,
    });
    await expect(failed.getByRole('alert')).toContainText('Resposta incompleta');
    await expect(preserved).toBeVisible();
    await failed.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await expect(page.getByRole('region', { name: city.name, exact: true })).toContainText(
      '25,4 °C',
    );
    await expect(
      page.getByRole('region', { name: 'Previsão diária', exact: true }).getByRole('listitem'),
    ).toHaveCount(5);
    await expect(failed.getByRole('alert')).toHaveCount(0);
    expect(attempts).toBe(2);
    expect(section === 'current' ? calls.forecast : calls.current).toBe(1);
  });
}

test('precipitação nula fica indisponível e não impede conversão dos dados válidos', async ({
  page,
}) => {
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/v1/forecast?**', async (route) => {
    await route.fulfill({
      json: {
        ...forecastResponse,
        current: { ...forecastResponse.current, precipitation: null },
        daily: { ...forecastResponse.daily, precipitation_sum: [null, 0, 0, 1, 2] },
      },
    });
  });
  await searchAndSelectCity(page);
  const current = page.getByRole('region', { name: city.name, exact: true });
  const forecast = page.getByRole('region', { name: 'Previsão diária', exact: true });
  await expect(current).toContainText('PrecipitaçãoIndisponível');
  await expect(forecast.getByRole('listitem').nth(0)).toContainText('PrecipitaçãoIndisponível');
  await expect(forecast.getByRole('listitem').nth(1)).toContainText('Precipitação0 mm');
  await expectWeatherAndConversion(page);
  await expect(current).toContainText('PrecipitaçãoIndisponível');
});
