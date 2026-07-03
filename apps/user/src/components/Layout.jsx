import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { logout, getStoredWalletAddress } from '../utils/keplr'
import { ShoppingBag, History, LogOut, Trophy, KeyRound } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const walletAddress = getStoredWalletAddress()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">🛍️ Lelang Pembeli</h1>
          <p className="text-sm text-slate-400 mt-1">Buyer Marketplace</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => navigate('/marketplace')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <ShoppingBag size={20} />
            <span>Marketplace</span>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <Trophy size={20} />
            <span>Papan Peringkat</span>
          </button>

          <button
            onClick={() => navigate('/reveal')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <KeyRound size={20} />
            <span>Reveal Portal</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition"
          >
            <History size={20} />
            <span>Riwayat & Klaim</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-slate-800 p-4 space-y-4">
          <div className="text-xs text-slate-400">
            <p>Wallet:</p>
            <p className="text-white font-mono text-xs truncate">{walletAddress?.slice(0, 20)}...</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-semibold"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white border-b h-16 px-8 flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Lelang Blockchain - Pembeli</h2>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
