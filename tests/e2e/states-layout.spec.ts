import { expect, test } from '@playwright/test';

for (const width of [320, 1440]) {
  test(`contêiner vazio e loading preservam dimensões em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('Salvador');
    await page.getByRole('option', { name: /Salvador.*Bahia/ }).click();
    await page.getByLabel('Cenário das condições').selectOption('loading');
    const section = page.getByRole('region', { name: 'Seção: Condições meteorológicas' });
    const indicator = section.getByRole('status');
    await expect(indicator).toHaveText('Carregando: Condições meteorológicas...');
    const loading = await section.boundingBox();
    const markup = await indicator.evaluate((element) => {
      const html = element.outerHTML;
      element.remove();
      return html;
    });
    const empty = await section.boundingBox();
    expect(loading).not.toBeNull();
    expect(empty).not.toBeNull();
    expect(loading!.height).toBe(empty!.height);
    expect(loading!.width).toBe(empty!.width);
    await section.evaluate(
      (element, html) => element.insertAdjacentHTML('beforeend', html),
      markup,
    );
    expect((await section.boundingBox())!.height).toBe(empty!.height);
  });
}
