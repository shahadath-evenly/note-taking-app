// Used for both the owner-scoped "My Notes" list and the admin all-notes
// list. The admin listing's notes carry an extra `owner` summary; this row
// shows that column only when it's present, instead of needing a second,
// near-duplicate row component just for the admin view.
export default function NoteRow({ row }) {
  const hasOwner = Boolean(row.owner);

  return (
    <tr>
      <td className="px-3 py-2 font-medium">{row.title}</td>
      <td className="max-w-sm truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.content}</td>
      {hasOwner ? (
        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
          {row.owner.firstName} {row.owner.lastName}
        </td>
      ) : null}
      <td className="px-3 py-2 text-zinc-500 dark:text-zinc-500">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}
