const COLORS = {
  Available: 'bg-green-100 text-green-700 border-green-300',
  'On Trip': 'bg-blue-100 text-blue-700 border-blue-300',
  'In Shop': 'bg-orange-100 text-orange-700 border-orange-300',
  Retired: 'bg-red-100 text-red-700 border-red-300',
  'Off Duty': 'bg-gray-100 text-gray-700 border-gray-300',
  Suspended: 'bg-red-100 text-red-700 border-red-300',
  Draft: 'bg-gray-100 text-gray-700 border-gray-300',
  Dispatched: 'bg-blue-100 text-blue-700 border-blue-300',
  Completed: 'bg-green-100 text-green-700 border-green-300',
  Cancelled: 'bg-red-100 text-red-700 border-red-300',
  active: 'bg-orange-100 text-orange-700 border-orange-300',
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}
