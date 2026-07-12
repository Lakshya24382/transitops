import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/fleet" element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher']}><Fleet /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer']}><Drivers /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher']}><Trips /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['Fleet Manager']}><Maintenance /></ProtectedRoute>} />
          <Route path="/fuel-expenses" element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}><FuelExpenses /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst', 'Safety Officer']}><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute allowedRoles={['Fleet Manager']}><Signup /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
