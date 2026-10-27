import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import DataDisclosure from '../../../src/components/DataDisclosure';

afterEach(cleanup);

it('explica dados locais e a integração futura sem alegar aprovação de termos ou retenção', () => {
  render(<DataDisclosure />);
  const disclosure = screen.getByRole('complementary', {
    name: 'Fonte e compartilhamento de dados',
  });
  expect(disclosure).toHaveTextContent(
    'nome digitado e as coordenadas selecionadas não são enviados',
  );
  expect(disclosure).toHaveTextContent('Open-Meteo');
  expect(disclosure).toHaveTextContent('T-22');
  expect(disclosure).toHaveTextContent('ainda pendente');
  expect(disclosure).not.toHaveTextContent(/não retém|não armazena|termos aprovados/i);
});
