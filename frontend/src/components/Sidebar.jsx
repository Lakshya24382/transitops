import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Truck, Users, Route, Wrench,
  Fuel, BarChart3, Settings, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  { to: '/fleet', label: 'Fleet', icon: Truck, roles: ['Fleet Manager', 'Dispatcher'] },
  { to: '/drivers', label: 'Drivers', icon: Users, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer'] },
  { to: '/trips', label: 'Trips', icon: Route, roles: ['Fleet Manager', 'Dispatcher'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Fleet Manager'] },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel, roles: ['Fleet Manager', 'Financial Analyst'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst', 'Safety Officer'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
];

const ROLE_ABBR = {
  'Fleet Manager': 'FM',
  'Dispatcher': 'DP',
  'Safety Officer': 'SO',
  'Financial Analyst': 'FA',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-gold rounded-md flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-semibold text-gray-900">TransitOps</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter(item => item.roles.includes(user?.role)).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive ? 'bg-orange-50 text-brand-gold border border-orange-200' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
              {ROLE_ABBR[user?.role] || user?.role}
            </span>
          </div>
          <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
