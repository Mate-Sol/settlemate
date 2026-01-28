import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/psp/Register';
import ApplyFinancingLimit from './pages/psp/ApplyFinancingLimit';
import PSPDashboard from './pages/psp/Dashboard';
import OrderBook from './pages/psp/OrderBook';
import Wallet from './pages/psp/Wallet';
import Onboarding from './pages/psp/Onboarding';
import CRODashboard from './pages/admin/cro/Dashboard';
import ApplicationReview from './pages/admin/cro/ApplicationReview';
import CFODashboard from './pages/admin/cfo/Dashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/psp/apply-limit" element={<ApplyFinancingLimit />} />
          
          {/* PSP Routes */}
          <Route 
            path="/psp/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['PSP']}>
                <PSPDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/psp/order-book" 
            element={
              <ProtectedRoute allowedRoles={['PSP']}>
                <OrderBook />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/psp/wallet" 
            element={
              <ProtectedRoute allowedRoles={['PSP']}>
                <Wallet />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/psp/onboarding" 
            element={
              <ProtectedRoute allowedRoles={['PSP']}>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          
          {/* CRO Admin Routes */}
          <Route 
            path="/admin/cro" 
            element={
              <ProtectedRoute allowedRoles={['CRO']}>
                <CRODashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cro/application/:id" 
            element={
              <ProtectedRoute allowedRoles={['CRO']}>
                <ApplicationReview />
              </ProtectedRoute>
            } 
          />
          
          {/* CFO Admin Routes */}
          <Route 
            path="/admin/cfo" 
            element={
              <ProtectedRoute allowedRoles={['CFO']}>
                <CFODashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
