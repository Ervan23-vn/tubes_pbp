import { useState, useEffect } from 'react';
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

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    // Check authentication status on mount
    setAuthenticated(isAuthenticated());
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!authenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route 
          path="/login" 
          element={
            authenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onSuccess={() => setAuthenticated(true)} />
          } 
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            authenticated ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/auctions/create" element={<CreateAuction />} />
                  <Route path="/auctions/:itemId" element={<AuctionDetail />} />
                  <Route path="/monitoring" element={<NetworkMonitoring />} />
                  <Route path="/security" element={<SecurityReport />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
