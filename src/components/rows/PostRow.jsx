export default function PostRow({ row }) {
  return (
    <tr>
      <td className="px-3 py-2 font-medium">{row.title}</td>
      <td className="max-w-md truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.content}</td>
      <td className="px-3 py-2 text-zinc-500 dark:text-zinc-500">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}
