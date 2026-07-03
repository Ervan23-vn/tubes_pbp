import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredWalletAddress } from '../utils/keplr'
import { auctionsAPI } from '../utils/api'

// =============================================
// DATA SIMULASI MARKETPLACE
// =============================================

const MOCK_ASSETS = [
  {
    id: 'ITEM-001',
    name: 'MacBook Pro M3 Max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    type: 'Core Data',
    timeLeft: '02:14:33',
    currentBid: 320.50,
    views: 142,
  },
  {
    id: 'ITEM-002',
    name: 'Rolex Submariner Date',
    image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=800&q=80',
    type: 'Real Estate',
    timeLeft: '01:06:12',
    currentBid: 1250.00,
    views: 89,
  },
  {
    id: 'ITEM-003',
    name: 'Vintage Gibson Les Paul',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    type: 'Core Data',
    timeLeft: '00:18:45',
    currentBid: 450.00,
    views: 214,
  },
  {
    id: 'ITEM-004',
    name: 'NFT CryptoPunk #7804',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    type: 'Quantum CPU',
    timeLeft: '03:02:58',
    currentBid: 5200.00,
    views: 327,
  },
  {
    id: 'ITEM-005',
    name: 'Tesla Model S Plaid',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
    type: 'Real Estate',
    timeLeft: '00:02:11',
    currentBid: 890.75,
    views: 56,
  },
  {
    id: 'ITEM-006',
    name: 'Apple Vision Pro',
    image: 'https://images.unsplash.com/photo-1632882765546-1ee75f53becb?auto=format&fit=crop&w=800&q=80',
    type: 'Quantum CPU',
    timeLeft: '01:45:30',
    currentBid: 675.00,
    views: 198,
  },
]

const MOCK_GLOBAL_COMMITS = [
  { id: 'c1', address: 'cosmos1qx7za4f2mn8', amount: 320.50, time: '2 menit lalu' },
  { id: 'c2', address: 'cosmos1m9kpd8e7rt3', amount: undefined, time: '5 menit lalu' },
  { id: 'c3', address: 'cosmos1v3hnc1b9wy6', amount: 1250.00, time: '8 menit lalu' },
  { id: 'c4', address: 'cosmos1jw82f6a3pk4', amount: 450.00, time: '12 menit lalu' },
  { id: 'c5', address: 'cosmos1tn5re2d4xs9', amount: undefined, time: '15 menit lalu' },
  { id: 'c6', address: 'cosmos1pk4eb7c1qm2', amount: 5200.00, time: '18 menit lalu' },
  { id: 'c7', address: 'cosmos1rs6wa9f5jn7', amount: 890.75, time: '22 menit lalu' },
  { id: 'c8', address: 'cosmos1hf4de7b2ck9', amount: 675.00, time: '25 menit lalu' },
]

// =============================================
// COMPONENT
// =============================================

export default function Marketplace() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState(MOCK_ASSETS)
  const [globalCommits] = useState(MOCK_GLOBAL_COMMITS)
  const [activeFilter, setActiveFilter] = useState('All')

  // Try to load real data from backend, fall back to mock
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await auctionsAPI.getAll()
        if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map(item => ({
            id: item.item_id,
            name: item.title,
            image: item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            type: item.category || 'Core Data',
            timeLeft: '02:00:00',
            currentBid: item.starting_price || 100,
            views: Math.floor(Math.random() * 300) + 20,
          }))
          setAssets(mapped)
        }
      } catch (err) {
        console.warn('Backend offline, menggunakan data simulasi marketplace.')
      }
    }
    fetchAuctions()
  }, [])

  // Stats
  const totalAssets = assets.length
  const totalVolume = globalCommits.reduce((sum, c) => sum + (c.amount || 0), 0)
  const totalCommits = globalCommits.length

  const parseSeconds = (t) => {
    const parts = t.split(':').map(Number)
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
  }
  const avgSeconds = assets.length > 0
    ? Math.round(assets.reduce((sum, a) => sum + parseSeconds(a.timeLeft), 0) / assets.length)
    : 0
  const avgMinutes = Math.floor(avgSeconds / 60)
  const avgSecs = avgSeconds % 60

  const stats = [
    { label: 'Total Aset Aktif', value: totalAssets, icon: 'token', color: 'text-primary' },
    { label: 'Volume Penawaran', value: `${totalVolume.toFixed(2)} ATOM`, icon: 'bar_chart', color: 'text-secondary' },
    { label: 'Komitmen Global', value: totalCommits, icon: 'lock', color: 'text-[#fbbf24]' },
    { label: 'Rata-rata Sisa Waktu', value: `${avgMinutes}m ${avgSecs}s`, icon: 'timer', color: 'text-[#10b981]' },
  ]

  const categories = ['All', 'Core Data', 'Quantum CPU', 'Real Estate']

  const filteredAssets = activeFilter === 'All'
    ? assets
    : assets.filter((a) => a.type === activeFilter)

  const handleCommitBid = (asset) => {
    navigate(`/auctions/${asset.id}/bid`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-gray-200 pb-6 mb-2">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Marketplace Protocol
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            Galeri Lelang Aset
          </h1>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            Protokol lelang langsung beroperasi secara aktif di jaringan blockchain
          </p>
        </div>
      </div>

      {/* Statistics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-2 hover:border-primary/30 transition-colors group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className={`material-symbols-outlined text-lg sm:text-xl ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity select-none`}>
                {stat.icon}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
            </div>
            <div>
              <p className="text-lg sm:text-xl text-gray-800 font-bold leading-tight">{stat.value}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Layout: Cards Grid + Recent Commits Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Active Auctions */}
        <section className="flex-grow lg:w-8/12 flex flex-col gap-6">
          <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 pb-4 mb-2 gap-4">
            <h2 className="text-lg md:text-xl text-gray-800 font-bold">Aset Lelang Aktif</h2>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-lg border text-[10px] sm:text-xs transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === cat
                      ? 'bg-primary/10 text-primary border-primary/45 font-semibold'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {cat === 'All' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
          </header>

          {/* Cards Grid */}
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center justify-center text-center py-16 gap-3 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-gray-300">info</span>
              <p className="text-sm text-gray-600">Tidak ada aset dalam kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-300">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-primary/25 transition-all duration-300 group"
                >
                  {/* Progress bar */}
                  <div className="h-1 w-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        asset.timeLeft.startsWith('00:02') ? 'bg-red-500 animate-pulse' : 'bg-secondary'
                      }`}
                      style={{
                        width: asset.timeLeft.startsWith('00') ? '30%' : '75%',
                      }}
                    ></div>
                  </div>

                  {/* Image */}
                  <div className="h-44 w-full bg-gray-100 relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-all duration-500"
                      src={asset.image}
                      alt={asset.name}
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-600 flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">visibility</span> {asset.views}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-4 flex-grow">
                    <div>
                      <h3 className="text-base text-gray-800 font-bold mb-0.5">{asset.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-gray-400">ID: {asset.id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[7px] bg-gray-100 border border-gray-200 text-gray-500 font-bold">
                          {asset.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-auto pt-3 border-t border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-gray-400">Tawaran Tertinggi</span>
                        <span className="text-primary text-sm font-bold">{asset.currentBid.toLocaleString('id-ID', { minimumFractionDigits: 2 })} ATOM</span>
                      </div>
                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="text-[10px] text-gray-400">Sisa Waktu</span>
                        <span className={`text-xs font-mono ${
                          asset.timeLeft.startsWith('00:02') ? 'text-red-500 font-bold' : 'text-secondary'
                        }`}>
                          {asset.timeLeft}
                        </span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-primary text-white hover:bg-secondary active:scale-95 transition-all py-2.5 rounded-lg text-xs uppercase tracking-wider mt-2 font-bold flex justify-center items-center gap-2 cursor-pointer shadow-sm"
                      onClick={() => handleCommitBid(asset)}
                    >
                      Ajukan Penawaran <span className="material-symbols-outlined text-[14px]">gavel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Commits Sidebar */}
        <aside className="w-full lg:w-4/12 xl:w-3/12 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Komitmen Terbaru (Global)
              </h3>
            </div>

            {globalCommits.length === 0 ? (
              <div className="text-center py-12 px-6 text-gray-400 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-gray-300">history</span>
                <p className="text-[10px] leading-relaxed">
                  Belum ada komitmen lelang yang dikirimkan.
                </p>
              </div>
            ) : (
              <div className="flex flex-col p-2 max-h-[420px] overflow-y-auto">
                {globalCommits.map((commit) => (
                  <div key={commit.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-[14px]">lock</span>
                      <span className="font-mono text-[11px] text-gray-700 group-hover:text-primary transition-colors">
                        {commit.address.substring(0, 10)}...{commit.address.substring(commit.address.length - 4)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-secondary font-semibold">
                        {commit.amount !== undefined ? `${commit.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })} ATOM` : 'Sealed 🔒'}
                      </span>
                      <span className="text-[9px] text-gray-400">{commit.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-gray-100 bg-slate-50 rounded-b-xl">
              <p className="text-[9px] text-gray-400 text-center uppercase tracking-wider">
                <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">info</span>
                Data simulasi — terhubung ke blockchain saat aktif
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
