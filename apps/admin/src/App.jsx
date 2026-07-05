import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateAuction from './pages/CreateAuction';
import AuctionDetail from './pages/AuctionDetail';
import NetworkMonitoring from './pages/NetworkMonitoring';
import SecurityReport from './pages/SecurityReport';

import { isAuthenticated } from './utils/keplr';

/**
 * TAHAP G - Frontend Admin
 * Lelang Auction Platform - Seller Center
 */

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            isAuthenticated() ? 
              <Navigate to="/dashboard" replace /> : 
              <Login />
          } 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auctions/create" element={<CreateAuction />} />
          <Route path="/auctions/:itemId" element={<AuctionDetail />} />
          <Route path="/monitoring" element={<NetworkMonitoring />} />
          <Route path="/security" element={<SecurityReport />} />
        </Route>

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
