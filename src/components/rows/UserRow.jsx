export default function UserRow({ row, onEdit, onDelete }) {
  const hasActions = Boolean(onEdit || onDelete);

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
