const StatCard = ({ label, value, sublabel, accent = 'teal', icon: Icon, className = '' }) => {
  const accentMap = {
    teal: 'text-teal-600 bg-teal-50',
    coral: 'text-coral-500 bg-coral-400/10',
    amber: 'text-amber-500 bg-amber-400/10',
    ink: 'text-ink-800 bg-slate-100',
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-soft ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentMap[accent]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold text-ink-950">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
};

export default StatCard;
