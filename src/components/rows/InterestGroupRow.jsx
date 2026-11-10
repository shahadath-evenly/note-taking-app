// One row per interest group from GET /admin/users/grouped-by-interests —
// `row` is `{ interest, users: [{ _id, firstName, lastName, email, role }], userCount }`
// exactly as the backend's single aggregation pipeline returns it. The
// pipeline already excludes users with no interests (documented default,
// not an "uncategorized" group), so `users` is never empty in practice;
// the fallback below just keeps the row from breaking if that ever changes.
export default function InterestGroupRow({ row }) {
  return (
    <tr>
      <td className="px-3 py-2 align-top font-medium">{row.interest}</td>
      <td className="px-3 py-2 align-top text-zinc-600 dark:text-zinc-400">
        {row.users && row.users.length > 0 ? (
          <ul className="space-y-1">
            {row.users.map((user) => (
              <li key={user._id}>
                {user.firstName} {user.lastName}{' '}
                <span className="text-zinc-400 dark:text-zinc-500">({user.email})</span>
              </li>
            ))}
          </ul>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2 align-top text-zinc-500 dark:text-zinc-500">{row.userCount}</td>
    </tr>
  );
}
