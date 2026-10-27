import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../../src/components/SearchBar';
import type { City } from '../../../src/types/weather';

afterEach(cleanup);

const springfieldIllinois: City = {
  name: 'Springfield',
  admin1: 'Illinois',
  country: 'United States',
  latitude: 39.78,
  longitude: -89.64,
};
const springfieldOregon: City = {
  name: 'Springfield',
  admin1: 'Oregon',
  country: 'United States',
  latitude: 44.05,
  longitude: -123.02,
};
const salvador: City = {
  name: 'Salvador',
  admin1: 'Bahia',
  country: 'Brazil',
  latitude: -12.97,
  longitude: -38.5,
};

interface ControlledSearchProps {
  suggestions?: City[];
  disabled?: boolean;
  onSearch: (city: string) => void;
  onSelect: (city: City) => void;
}

function ControlledSearch({
  suggestions = [springfieldIllinois, springfieldOregon],
  disabled = false,
  onSearch,
  onSelect,
}: ControlledSearchProps) {
  const [query, setQuery] = useState('');
  return (
    <SearchBar
      query={query}
      onQueryChange={setQuery}
      suggestions={suggestions}
      onSearch={onSearch}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}

describe('SearchBar', () => {
  it('expõe uma região de busca e um campo com label acessível', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBe(screen.getByLabelText('Cidade'));
  });

  it('envia pelo botão o nome sem espaços nas extremidades, preservando a grafia', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), '  São João d’Aliança  ');
    expect(onSearch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São João d’Aliança');
  });

  it('permite enviar a busca com Enter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), 'Porto Alegre{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Porto Alegre');
  });

  it.each(['', '   '])('não busca com texto vazio (%j) e informa o erro', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByLabelText('Cidade');
    if (value) await user.type(input, value);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Digite o nome de uma cidade.');
  });

  it('limpa o erro ao editar e permite uma nova tentativa', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await user.type(screen.getByLabelText('Cidade'), 'Recife');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toHaveAttribute('aria-invalid', 'false');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('bloqueia campo, botão e submissão quando disabled está ativo', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByLabelText('Cidade'), 'Recife');

    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByLabelText('Cidade')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('usa ids distintos para associar labels em múltiplas instâncias', () => {
    render(
      <>
        <SearchBar onSearch={vi.fn()} />
        <SearchBar onSearch={vi.fn()} />
      </>,
    );

    const inputs = screen.getAllByLabelText('Cidade');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });

  it('expõe as sugestões como combobox e apresenta cidades homônimas com região e país', async () => {
    const user = userEvent.setup();
    render(<ControlledSearch onSearch={vi.fn()} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });

    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');

    await user.type(input, 'Spring');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAccessibleName('Springfield, Illinois, United States');
    expect(options[1]).toHaveAccessibleName('Springfield, Oregon, United States');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
    expect(screen.getByText(/Use as setas para navegar/)).toHaveClass('sr-only');
  });

  it('apresenta cidade sem metadados opcionais apenas pelo nome', async () => {
    const user = userEvent.setup();
    const cityWithoutMetadata: City = {
      name: 'Springfield',
      latitude: 10,
      longitude: 20,
    };
    render(
      <ControlledSearch
        onSearch={vi.fn()}
        onSelect={vi.fn()}
        suggestions={[cityWithoutMetadata]}
      />,
    );
    await user.type(screen.getByRole('combobox', { name: 'Cidade' }), 'Spring');

    expect(screen.getByRole('option', { name: 'Springfield' })).toBeInTheDocument();
  });

  it('reabre resultados que chegam depois que o foco retorna ao campo', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    const renderSearch = (suggestions: City[]) => (
      <>
        <ControlledSearch onSearch={onSearch} onSelect={onSelect} suggestions={suggestions} />
        <button type="button">Fora</button>
      </>
    );
    const { rerender } = render(renderSearch([]));
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Salvador');
    await user.click(screen.getByRole('button', { name: 'Fora' }));
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'false');
    rerender(renderSearch([salvador]));

    expect(screen.getByRole('option', { name: 'Salvador, Bahia, Brazil' })).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('envia o texto exato na edição e reabre as sugestões', () => {
    const onQueryChange = vi.fn();
    const suggestions = [salvador];
    const { rerender } = render(
      <SearchBar
        query=""
        onQueryChange={onQueryChange}
        suggestions={suggestions}
        onSearch={vi.fn()}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Cidade' });

    fireEvent.submit(screen.getByRole('search'));
    expect(input).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade.');

    fireEvent.change(input, { target: { value: '  São Luís  ' } });

    expect(onQueryChange).toHaveBeenCalledExactlyOnceWith('  São Luís  ');
    rerender(
      <SearchBar
        query="  São Luís  "
        onQueryChange={onQueryChange}
        suggestions={suggestions}
        onSearch={vi.fn()}
      />,
    );
    expect(input).toHaveValue('  São Luís  ');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Salvador, Bahia, Brazil' })).toBeInTheDocument();
  });

  it('cicla pelas opções com as setas e seleciona somente a opção ativa ao pressionar Enter', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    render(<ControlledSearch onSearch={onSearch} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Spring');

    await user.keyboard('{ArrowDown}');
    const firstOption = screen.getAllByRole('option')[0];
    expect(input).toHaveAttribute('aria-activedescendant', firstOption.id);
    expect(firstOption).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowUp}');
    const secondOption = screen.getAllByRole('option')[1];
    expect(input).toHaveAttribute('aria-activedescendant', secondOption.id);
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', firstOption.id);

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(springfieldIllinois);
    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Escape fecha a lista e remove a opção ativa sem selecionar', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledSearch onSearch={vi.fn()} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Spring');
    await user.keyboard('{ArrowDown}');

    await user.keyboard('{Escape}');

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0].id);
  });

  it('Escape com lista aberta preserva a consulta e duas setas ativam a segunda opção', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledSearch onSearch={vi.fn()} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Spring');

    expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(false);
    expect(input).toHaveValue('Spring');
    expect(fireEvent.keyDown(input, { key: 'Escape' })).toBe(true);

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(springfieldOregon);
  });

  it('abre sugestões do retry após foco programático vindo de botão fora do formulário', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    function RetryHarness({ suggestions }: { suggestions: City[] }) {
      const [query, setQuery] = useState('Salvador');
      return (
        <>
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            suggestions={suggestions}
            onSearch={vi.fn()}
            onSelect={onSelect}
          />
          <button
            type="button"
            onClick={() => {
              const input = screen.getByRole('combobox', { name: 'Cidade' }) as HTMLInputElement;
              input.focus();
              input.select();
            }}
          >
            Tentar novamente
          </button>
        </>
      );
    }
    const { rerender } = render(<RetryHarness suggestions={[]} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'false');

    rerender(<RetryHarness suggestions={[salvador]} />);

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Salvador, Bahia, Brazil' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(salvador);
  });

  it('seleciona a opção clicada mantendo o foco no campo', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledSearch onSearch={vi.fn()} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Spring');

    await user.click(screen.getByRole('option', { name: 'Springfield, Oregon, United States' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(springfieldOregon);
    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Enter sem opção ativa envia a consulta, sem escolher o primeiro resultado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    render(<ControlledSearch onSearch={onSearch} onSelect={onSelect} />);
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Springfield{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Springfield');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('não permite edição, seleção ou busca quando o modo controlado está disabled', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    render(
      <ControlledSearch
        onSearch={onSearch}
        onSelect={onSelect}
        disabled
        suggestions={[salvador]}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Cidade' });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Salvador' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('invalida a opção ativa quando os resultados mudam', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onSearch = vi.fn();
    const { rerender } = render(
      <ControlledSearch
        onSearch={onSearch}
        onSelect={onSelect}
        suggestions={[springfieldIllinois]}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Cidade' });
    await user.type(input, 'Spring');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant');

    rerender(
      <ControlledSearch
        onSearch={onSearch}
        onSelect={onSelect}
        suggestions={[springfieldOregon]}
      />,
    );

    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(
      screen.getByRole('option', { name: 'Springfield, Oregon, United States' }),
    ).toHaveAttribute('aria-selected', 'false');
    await user.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Spring');
  });
});
