export default function EmptyState({ message = 'Nothing to show yet.' }) {
  return <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{message}</p>;
}
