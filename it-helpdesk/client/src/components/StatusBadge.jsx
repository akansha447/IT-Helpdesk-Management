const STATUS_STYLES = {
  Open: { dot: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50' },
  'In Progress': { dot: 'bg-amber-400', text: 'text-amber-500', bg: 'bg-amber-400/10' },
  'On Hold': { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
  Resolved: { dot: 'bg-ink-700', text: 'text-ink-700', bg: 'bg-slate-100' },
  Closed: { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
