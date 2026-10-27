import { expect, test } from '@playwright/test';
import { city, mockWeatherApi } from './helpers/weatherApi';

for (const width of [320, 1440]) {
  test(`contêiner vazio e loading preservam dimensões em ${width}px`, async ({ page }) => {
    await mockWeatherApi(page);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('https://geocoding-api.open-meteo.com/v1/search?**', async (route) => {
      await pending;
      await route.fulfill({ json: { results: [city] } });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const section = page.getByRole('main');
    const indicator = section.getByRole('status', { includeHidden: true });
    await expect(indicator).toHaveText('Buscando cidades...');
    const loading = await section.boundingBox();
    await indicator.evaluate((element) => {
      element.style.display = 'none';
    });
    const empty = await section.boundingBox();
    expect(loading).not.toBeNull();
    expect(empty).not.toBeNull();
    expect(loading!.height).toBe(empty!.height);
    expect(loading!.width).toBe(empty!.width);
    await indicator.evaluate((element) => {
      element.style.removeProperty('display');
    });
    expect((await section.boundingBox())!.height).toBe(empty!.height);
    release();
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    await expect(page.getByRole('region', { name: 'Salvador' })).toBeVisible();
  });
}
