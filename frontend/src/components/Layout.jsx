import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ title, children }) {
  const { user } = useAuth();
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{user?.name}</span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
