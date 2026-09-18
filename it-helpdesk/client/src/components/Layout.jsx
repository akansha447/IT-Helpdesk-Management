import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Ticket,
  Users,
  FolderKanban,
  LogOut,
  PlusCircle,
  Headset,
  GitPullRequest,
  Building2,
  BookOpen,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, roles: ['admin', 'manager', 'agent', 'employee'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: ['admin', 'manager', 'agent', 'employee'] },
  { to: '/users', label: 'Team', icon: Users, roles: ['admin', 'manager'] },
  { to: '/categories', label: 'Categories', icon: FolderKanban, roles: ['admin'] },
  { to: '/change-requests', label: 'Change requests', icon: GitPullRequest, roles: ['admin', 'manager', 'agent', 'employee'] },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen, roles: ['admin', 'manager', 'agent', 'employee'] },
  { to: '/activity', label: 'Activity Log', icon: History, roles: ['admin', 'manager', 'agent', 'employee'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['admin'] },
];

const roleLabel = { admin: 'Administrator', manager: 'Manager', agent: 'Agent', employee: 'Employee' };

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-ink-950 text-slate-200">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-500 text-ink-950">
            <Headset size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">DeskLine</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ink-800 text-white'
                    : 'text-slate-400 hover:bg-ink-900 hover:text-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <button
            onClick={() => navigate('/tickets/new')}
            className="focus-ring mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            <PlusCircle size={17} />
            New ticket
          </button>

          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel[user?.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="focus-ring rounded-md p-2 text-slate-400 hover:bg-ink-900 hover:text-coral-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
