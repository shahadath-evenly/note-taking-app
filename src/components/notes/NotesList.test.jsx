import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesList from './NotesList';

const notes = [
  { _id: '1', title: 'First note', content: 'Some content here', createdAt: '2024-01-02T00:00:00.000Z' },
  { _id: '2', title: 'Second note', content: '', createdAt: '2024-01-01T00:00:00.000Z' },
];

function baseProps(overrides = {}) {
  return {
    notes,
    selectedId: null,
    onSelect: vi.fn(),
    onCreateDraft: vi.fn(),
    search: '',
    onSearch: vi.fn(),
    loading: false,
    error: null,
    hasMore: false,
    onLoadMore: vi.fn(),
    isLoadingMore: false,
    ...overrides,
  };
}

describe('NotesList', () => {
  it('renders each note\'s title and a content snippet', () => {
    render(<NotesList {...baseProps()} />);
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
    expect(screen.getByText(/Some content here/)).toBeInTheDocument();
  });

  it('falls back to a placeholder snippet when content is empty', () => {
    render(<NotesList {...baseProps()} />);
    expect(screen.getByText(/No additional text/)).toBeInTheDocument();
  });

  it('calls onSelect with the clicked note', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<NotesList {...baseProps({ onSelect })} />);

    await user.click(screen.getByText('First note'));
    expect(onSelect).toHaveBeenCalledWith(notes[0]);
  });

  it('calls onCreateDraft when "New note" is clicked', async () => {
    const user = userEvent.setup();
    const onCreateDraft = vi.fn();
    render(<NotesList {...baseProps({ onCreateDraft })} />);

    await user.click(screen.getByRole('button', { name: 'New note' }));
    expect(onCreateDraft).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state', () => {
    render(<NotesList {...baseProps({ loading: true })} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error state', () => {
    render(<NotesList {...baseProps({ error: 'Could not load notes', notes: [] })} />);
    expect(screen.getByText('Could not load notes')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notes', () => {
    render(<NotesList {...baseProps({ notes: [] })} />);
    expect(screen.getByText('No notes found.')).toBeInTheDocument();
  });

  it('only shows "Load more" when hasMore is true', () => {
    const { rerender } = render(<NotesList {...baseProps({ hasMore: false })} />);
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();

    rerender(<NotesList {...baseProps({ hasMore: true })} />);
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  it('calls onLoadMore when "Load more" is clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(<NotesList {...baseProps({ hasMore: true, onLoadMore })} />);

    await user.click(screen.getByText('Load more'));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  describe('search debounce', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces search input before calling onSearch', async () => {
      const onSearch = vi.fn();
      render(<NotesList {...baseProps({ onSearch })} />);

      vi.useFakeTimers();
      fireEvent.change(screen.getByLabelText('Search notes'), { target: { value: 'grocery' } });
      expect(onSearch).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(400);
      expect(onSearch).toHaveBeenCalledWith('grocery');
    });
  });
});
