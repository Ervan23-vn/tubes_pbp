import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/keplr'
import Layout from './components/Layout'
import Login from './pages/Login'
import Marketplace from './pages/Marketplace'
import AuctionDetail from './pages/AuctionDetail'
import SubmitBid from './pages/SubmitBid'
import RevealBid from './pages/RevealBid'
import History from './pages/History'
import Leaderboard from './pages/Leaderboard'

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

export default function App() {
  useEffect(() => {
    // Clear credentials on start to force login first
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('wallet_address')
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/auctions/:itemId" element={<AuctionDetail />} />
          <Route path="/auctions/:itemId/bid" element={<SubmitBid />} />
          <Route path="/auctions/:itemId/reveal" element={<RevealBid />} />
          <Route path="/reveal" element={<RevealBid />} />
          <Route path="/history" element={<History />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
