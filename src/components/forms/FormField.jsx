export default function FormField({ label, name, error, as = 'input', className = '', ...rest }) {
  const Field = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <Field
        id={name}
        name={name}
        className={`rounded border border-zinc-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
        {...rest}
      />
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
