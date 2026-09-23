import { NavLink } from 'react-router-dom';
import { ClipboardCheck, ClipboardPlus, Hammer } from 'lucide-react';

const ITEMS = [
  { to: '/cab/create', label: 'Create', icon: ClipboardPlus },
  { to: '/cab/authorization', label: 'Authorization', icon: ClipboardCheck },
  { to: '/cab/implementation', label: 'Implementation', icon: Hammer },
  { to: '/cab/post-implementation', label: 'Post-implementation', icon: ClipboardCheck },
];

const CabNavigation = () => (
  <nav className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-soft">
    {ITEMS.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
        <Icon size={16} />
        {label}
      </NavLink>
    ))}
  </nav>
);

export default CabNavigation;