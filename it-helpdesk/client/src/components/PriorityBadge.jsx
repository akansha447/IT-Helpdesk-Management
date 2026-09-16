const PRIORITY_STYLES = {
  Low: 'text-slate-500 border-slate-200',
  Medium: 'text-teal-600 border-teal-200',
  High: 'text-amber-500 border-amber-300',
  Urgent: 'text-coral-500 border-coral-300',
};

const PriorityBadge = ({ priority }) => {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
        PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium
      }`}
    >
      {priority}
    </span>
  );
};

export default PriorityBadge;
