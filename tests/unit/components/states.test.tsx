import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../../src/components/states/EmptyState';
import ErrorState from '../../../src/components/states/ErrorState';
import LoadingState from '../../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia o carregamento com role status e texto padrão', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados...');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permite identificar a operação na mensagem de carregamento', () => {
    render(<LoadingState message="Carregando previsão..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão...');
  });
});

describe('ErrorState', () => {
  it.each([
    'search',
    'current',
    'forecast',
  ] as const)('distingue erro/timeout de %s', (operation) => {
    const onRetry = vi.fn();
    const labels = {
      search: 'Busca de cidades',
      current: 'Condições meteorológicas',
      forecast: 'Previsão diária',
    };
    const { rerender } = render(
      <ErrorState operation={operation} status="error" onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(`Falha: ${labels[operation]}`);
    rerender(<ErrorState operation={operation} status="timeout" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      `Tempo limite excedido: ${labels[operation]}`,
    );
  });
  it('anuncia a mensagem e chama somente o retry recebido uma vez ao clicar', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível carregar a previsão." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a previsão.');
    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(['{Enter}', ' '])('permite retry pelo teclado (%s)', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="A busca excedeu o tempo limite." onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('não envia um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onRetry = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Falha ao carregar condições." onRetry={onRetry} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('editar e repetir chamam somente a ação correspondente', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onRetry = vi.fn();
    render(
      <EmptyState title="Sem dados" hint="Edite ou repita." onEdit={onEdit} onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('button', { name: 'Editar busca' }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith();
    expect(onRetry).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['Nenhuma cidade encontrada', 'Confira o nome ou pesquise outra cidade.'],
    ['Não foi possível identificar a cidade', 'Tente um nome de cidade diferente.'],
    ['Dados meteorológicos indisponíveis', 'Pesquise outra cidade ou tente mais tarde.'],
  ])('apresenta título e dica para %s', (title, hint) => {
    render(<EmptyState title={title} hint={hint} />);

    expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(hint)).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('associa cada instância ao próprio título', () => {
    render(
      <>
        <EmptyState title="Nenhuma cidade encontrada" hint="Edite sua busca." />
        <EmptyState title="Sem previsão" hint="Tente mais tarde." />
      </>,
    );

    const regions = screen.getAllByRole('region');
    expect(regions[0].getAttribute('aria-labelledby')).not.toBe(
      regions[1].getAttribute('aria-labelledby'),
    );
  });
});
