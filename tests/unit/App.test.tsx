import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function selectSalvador(user: ReturnType<typeof userEvent.setup>, index = 0) {
  await user.type(screen.getByLabelText('Cidade'), 'Salvador');
  const list = await screen.findByRole('listbox');
  const cityOptions = within(list).getAllByRole('option');
  await user.click(cityOptions[index]);
}

describe('App com dados mock', () => {
  it('inicia sem seleção/persistência e mostra aviso antes da busca', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Weather App' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Como está o clima?' })).toBeInTheDocument();
    const disclosure = screen.getByRole('complementary', {
      name: 'Fonte e compartilhamento de dados',
    });
    expect(disclosure).toHaveTextContent('não são enviados');
    expect(
      disclosure.compareDocumentPosition(screen.getByRole('search')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('aguarda seleção explícita e usa os dados da segunda localidade homônima', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Salvador');
    await screen.findByRole('option', { name: /Salvador.*Bahia/ });
    expect(screen.queryByRole('region', { name: 'Salvador' })).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(screen.getByText('12,4 °C')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Localidade selecionada: Salvador, Localidade de teste.*Condições e previsão disponíveis/,
      ),
    ).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Localidade de teste (fictícia), Demonstração')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(fetchSpy).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Cidade'), 'x');
    expect(screen.queryByRole('region', { name: 'Salvador' })).not.toBeInTheDocument();
  });

  it('mostra busca vazia sem tratar como erro e permite editar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Recife');
    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar busca' }));
    expect(screen.getByLabelText('Cidade')).toHaveFocus();
  });

  it('distingue candidatos inválidos e permite repetir apenas a busca', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Cenário da busca'), 'invalid');
    await user.type(screen.getByLabelText('Cidade'), 'Salvador');
    expect(
      await screen.findByRole('heading', { name: 'Não foi possível identificar a cidade' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('option', { name: /Salvador.*Bahia/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toHaveValue('Salvador');
  });

  it('recupera uma seção por vez, mantém a outra e preserva foco', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectSalvador(user);
    await user.selectOptions(screen.getByLabelText('Cenário das condições'), 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('Condições meteorológicas');
    expect(screen.getByRole('region', { name: 'Previsão diária' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Cenário da previsão'), 'timeout');
    const currentSection = screen.getByRole('region', { name: 'Seção: Condições meteorológicas' });
    await user.click(within(currentSection).getByRole('button', { name: 'Tentar novamente' }));
    expect(currentSection).toHaveFocus();
    expect(screen.getByRole('region', { name: 'Salvador' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Tempo limite excedido: Previsão diária');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('region', { name: 'Previsão diária' })).toBeInTheDocument();
  });

  it('exibe loading, vazio e parcial de previsão mantendo o hero', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectSalvador(user);
    const section = screen.getByRole('region', { name: 'Seção: Previsão diária' });
    await user.selectOptions(screen.getByLabelText('Cenário da previsão'), 'loading');
    expect(within(section).getByRole('status')).toHaveTextContent('Carregando: Previsão diária');
    expect(screen.getByRole('region', { name: 'Salvador' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Cenário da previsão'), 'empty');
    expect(within(section).getByRole('heading')).toHaveTextContent(
      'Dados indisponíveis: Previsão diária',
    );
    await user.selectOptions(screen.getByLabelText('Cenário da previsão'), 'partial');
    expect(within(section).getAllByRole('listitem')).toHaveLength(5);
    expect(within(section).getAllByText('Indisponível')).toHaveLength(6);
  });

  it('converte as onze temperaturas da origem sem modificar o mock', async () => {
    const original = structuredClone(mockWeatherData);
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await selectSalvador(user);
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));
    expect(within(screen.getByRole('main')).getAllByText(/°F/)).toHaveLength(11);
    await user.selectOptions(screen.getByLabelText('Cenário da previsão'), 'error');
    await user.click(screen.getByRole('button', { name: 'Graus Celsius' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('25,4 °C')).toBeInTheDocument();
    expect(mockWeatherData).toEqual(original);
    unmount();
    render(<App />);
    expect(screen.getByLabelText('Cidade')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
