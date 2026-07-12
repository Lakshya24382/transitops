export default function KPICard({ label, value, accent }) {
  const accentColor = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-500',
    red: 'text-red-500',
    default: 'text-gray-900',
  }[accent || 'default'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accentColor}`}>{value}</p>
    </div>
  );
}
