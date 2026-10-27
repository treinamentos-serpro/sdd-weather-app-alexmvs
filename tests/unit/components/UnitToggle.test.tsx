import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../../src/components/UnitToggle';
import type { Unit } from '../../../src/types/weather';

afterEach(cleanup);

describe('UnitToggle', () => {
  it.each<Unit>(['celsius', 'fahrenheit'])('indica a unidade %s recebida pela prop', (unit) => {
    const onChange = vi.fn();
    render(<UnitToggle unit={unit} onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });

    expect(within(group).getAllByRole('button')).toHaveLength(2);
    expect(within(group).getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'celsius'),
    );
    expect(within(group).getByRole('button', { name: 'Graus Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      String(unit === 'fahrenheit'),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('notifica a escolha uma vez e reflete a atualização recebida do componente pai', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    const fahrenheit = screen.getByRole('button', { name: 'Graus Fahrenheit' });

    await user.click(fahrenheit);

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'false');

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    const celsius = screen.getByRole('button', { name: 'Graus Celsius' });
    expect(celsius).toHaveAttribute('aria-pressed', 'false');

    onChange.mockClear();
    await user.click(celsius);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
  });

  it('permite navegar com Tab e Shift+Tab e ativar com Enter ou Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const celsius = screen.getByRole('button', { name: 'Graus Celsius' });
    const fahrenheit = screen.getByRole('button', { name: 'Graus Fahrenheit' });

    await user.tab();
    expect(celsius).toHaveFocus();
    await user.tab();
    expect(fahrenheit).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');

    onChange.mockClear();
    await user.tab({ shift: true });
    expect(celsius).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('celsius');
  });

  it('não envia um formulário ao selecionar a unidade', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <UnitToggle unit="celsius" onChange={onChange} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
