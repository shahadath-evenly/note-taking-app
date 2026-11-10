// Used for both the owner-scoped "My Notes" list and the admin all-notes
// list. The admin listing's notes carry an extra `owner` field; this row
// shows that column whenever the field is *present on the row shape* —
// checked by key existence, not truthiness, since the backend sets
// `owner: null` (not omitted) for a note whose owning user was since
// deleted. Using truthiness here would silently drop that one row's cell
// and misalign it against the header's fixed column count. Likewise, the
// actions cell (edit/delete) only renders when the calling page passes
// those callbacks via `rowProps` on <Table> — the read-only admin view
// simply won't pass them.
export default function NoteRow({ row, onEdit, onDelete }) {
  const hasOwner = Object.prototype.hasOwnProperty.call(row, 'owner');
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <tr>
      <td className="px-3 py-2 font-medium">{row.title}</td>
      <td className="max-w-sm truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">{row.content}</td>
      {hasOwner ? (
        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
          {row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '—'}
        </td>
      ) : null}
      <td className="px-3 py-2 text-zinc-500 dark:text-zinc-500">
        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
      </td>
      {hasActions ? (
        <td className="px-3 py-2">
          <div className="flex gap-3">
            {onEdit ? (
              <button type="button" onClick={() => onEdit(row)} className="text-primary hover:underline">
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                Delete
              </button>
            ) : null}
          </div>
        </td>
      ) : null}
    </tr>
  );
}
