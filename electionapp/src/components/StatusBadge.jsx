export function StatusBadge({ status }) {
  const config = {
    ONGOING: { label: 'Voting open', className: 'border-blue-500/40 text-blue-400', icon: '⊙' },
    NOT_STARTED: { label: 'Nominations open', className: 'border-amber-500/40 text-amber-400', icon: '⏱' },
    ENDED: { label: 'Closed', className: 'border-neutral-500/40 text-neutral-400', icon: '☐' },
  };

  const { label, className, icon } = config[status] ?? config.ENDED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${className}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}
