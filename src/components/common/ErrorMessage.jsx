export default function ErrorMessage({ message, errors }) {
  if (!message && (!errors || errors.length === 0)) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {message ? <p>{message}</p> : null}
      {errors && errors.length > 0 ? (
        <ul className="mt-1 list-disc pl-4">
          {errors.map((error, index) => (
            <li key={error.field || index}>{error.message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
