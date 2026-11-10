import Spinner from '@/components/common/Spinner';

export default function TableStates({ status, message, columnCount }) {
  if (status !== 'loading' && status !== 'error' && status !== 'empty') {
    return null;
  }

  const isError = status === 'error';

  return (
    <tr>
      <td colSpan={columnCount} className="px-3 py-10 text-center text-sm">
        {status === 'loading' ? (
          <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Spinner />
            Loading…
          </span>
        ) : (
          <span className={isError ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400'}>
            {message || (isError ? 'Something went wrong.' : 'No records found.')}
          </span>
        )}
      </td>
    </tr>
  );
}
