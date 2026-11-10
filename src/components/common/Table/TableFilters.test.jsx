import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableFilters from './TableFilters';

const filters = [
  {
    name: 'role',
    label: 'Role',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
    ],
  },
];

describe('TableFilters', () => {
  it('renders nothing when no filters are configured', () => {
    const { container } = render(<TableFilters filters={[]} query={{}} onFilterChange={() => {}} onReset={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not show a reset button when no filter is active', () => {
    render(<TableFilters filters={filters} query={{ role: '' }} onFilterChange={() => {}} onReset={() => {}} />);
    expect(screen.queryByText('Reset filters')).not.toBeInTheDocument();
  });

  it('shows a reset button once a filter is active, and it clears on click', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<TableFilters filters={filters} query={{ role: 'admin' }} onFilterChange={() => {}} onReset={onReset} />);

    const resetButton = screen.getByText('Reset filters');
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('supports typing to filter the option list (autocomplete), not just a flat dropdown', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<TableFilters filters={filters} query={{ role: '' }} onFilterChange={onFilterChange} onReset={() => {}} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, 'adm');

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByText('User')).not.toBeInTheDocument();

    await user.click(screen.getByText('Admin'));
    expect(onFilterChange).toHaveBeenCalledWith('role', 'admin');
  });

  it('selecting "All" clears the filter value', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<TableFilters filters={filters} query={{ role: 'admin' }} onFilterChange={onFilterChange} onReset={() => {}} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('All'));

    expect(onFilterChange).toHaveBeenCalledWith('role', '');
  });
});
