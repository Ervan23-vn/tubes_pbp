import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout, getStoredWalletAddress } from '../utils/keplr'
import { LayoutDashboard, PlusCircle, Activity, Shield, LogOut, Wallet } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const walletAddress = getStoredWalletAddress()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/auctions/create', name: 'Buat Lelang', icon: PlusCircle },
    { path: '/monitoring', name: 'Monitoring Jaringan', icon: Activity },
    { path: '/security', name: 'Laporan Keamanan', icon: Shield },
  ]

  const isActive = (path) => location.pathname === path

  const formattedAddress = walletAddress
    ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 6)}`
    : ''

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Container */}
      <div className="w-64 bg-slate-950 flex flex-col justify-between border-r border-slate-900 text-white shadow-2xl relative">
        
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-900 bg-slate-950 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Lelang Chain
              </h1>
            </div>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mt-0.5">
              Admin
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/5 text-blue-400 border-l-4 border-blue-500 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border-l-4 border-transparent'
                  }`}
                >
                  <Icon 
                    size={18} 
                    className={`transition-transform duration-300 ${
                      active ? 'scale-110 text-blue-400' : 'group-hover:scale-110 text-slate-400'
                    }`} 
                  />
                  <span className="text-xs tracking-wide">{item.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Profile / Wallet Section */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-4">
          {walletAddress && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 font-mono tracking-wider uppercase">
                  <Wallet size={12} />
                  <span>Wallet Connected</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-mono text-slate-200 select-all truncate">
                  {formattedAddress}
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Network: lelang-testnet
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-300 rounded-xl transition-all duration-300 font-semibold text-xs tracking-wider uppercase cursor-pointer"
          >
            <LogOut size={14} />
            <span>Keluar Sesi</span>
          </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 h-16 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 text-[10px] font-bold uppercase tracking-wider font-mono">
              Admin
            </span>
            <h2 className="text-sm font-bold text-slate-800 tracking-wide">
              Lelang Blockchain Platform
            </h2>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">System Status</p>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              Synchronized
            </p>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
