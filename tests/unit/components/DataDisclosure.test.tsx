import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import DataDisclosure from '../../../src/components/DataDisclosure';

afterEach(cleanup);

it('explica o envio à API após seleção sem alegar aprovação de termos ou retenção', () => {
  render(<DataDisclosure />);
  const disclosure = screen.getByRole('complementary', {
    name: 'Fonte e compartilhamento de dados',
  });
  expect(disclosure).toHaveTextContent('nome pesquisado é enviado à Open-Meteo');
  expect(disclosure).toHaveTextContent('Ao selecionar uma sugestão, as coordenadas dessa cidade');
  expect(disclosure).not.toHaveTextContent('automaticamente');
  expect(disclosure).toHaveTextContent('Open-Meteo');
  expect(disclosure).toHaveTextContent('T-22');
  expect(disclosure).toHaveTextContent('bloqueadores de lançamento');
  expect(disclosure).toHaveTextContent('90 dias');
  expect(disclosure).toHaveTextContent('atualização do modelo é desconhecido');
  expect(screen.getByRole('link', { name: 'GeoNames' })).toHaveAttribute(
    'href',
    'https://www.geonames.org/',
  );
  expect(screen.getByRole('link', { name: 'CC BY 4.0' })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/4.0/',
  );
  expect(disclosure).toHaveTextContent('Dados adaptados');
  expect(disclosure).not.toHaveTextContent(/não retém|não armazena|termos aprovados/i);
});
