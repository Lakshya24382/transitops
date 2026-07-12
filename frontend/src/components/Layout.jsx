import Sidebar from './Sidebar';

export default function Layout({ title, children }) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 px-6 py-6">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
