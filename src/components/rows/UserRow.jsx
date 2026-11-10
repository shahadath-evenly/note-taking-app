export default function UserRow({ row }) {
  return (
    <tr>
      <td className="px-3 py-2">
        {row.firstName} {row.lastName}
      </td>
      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.email}</td>
      <td className="px-3 py-2 capitalize">{row.role}</td>
      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
        {row.interests && row.interests.length > 0 ? row.interests.join(', ') : '—'}
      </td>
      <td className="px-3 py-2 text-zinc-500 dark:text-zinc-500">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}
