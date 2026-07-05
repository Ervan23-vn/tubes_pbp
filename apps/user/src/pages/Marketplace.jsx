import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredWalletAddress } from '../utils/keplr'
import { auctionsAPI, zkpAPI } from '../utils/api'

// =============================================
// COMPONENT
// =============================================

export default function Marketplace() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState([])
  const [globalCommits, setGlobalCommits] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')

  const formatTimeLeft = (endTimeStr) => {
    if (!endTimeStr) return '00:00:00'
    const diff = new Date(endTimeStr) - new Date()
    if (diff <= 0) return '00:00:00'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':')
  }

  // Load real data from backend
  useEffect(() => {
    const fetchAuctionsAndCommits = async () => {
      try {
        const response = await auctionsAPI.getAll()
        if (response && response.success && Array.isArray(response.data)) {
          const mapped = response.data.map(item => ({
            id: item.item_id,
            name: item.title,
            image: item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            type: item.category || 'Core Data',
            endTime: item.end_time,
            timeLeft: formatTimeLeft(item.end_time),
            currentBid: item.current_highest_bid || item.starting_price || 0,
            views: Math.floor(Math.random() * 300) + 20,
          }))
          setAssets(mapped)

          // Fetch proofs for each auction to compile global commits
          const allCommits = []
          for (const item of response.data) {
            try {
              const proofsRes = await zkpAPI.getProofsForAuction(item.item_id)
              if (proofsRes && proofsRes.success && Array.isArray(proofsRes.data)) {
                proofsRes.data.forEach(proof => {
                  const pDate = new Date(proof.proof_generated_at)
                  const diffMin = Math.round((new Date() - pDate) / 60000)
                  const timeStr = diffMin <= 0 ? 'baru saja' : diffMin < 60 ? `${diffMin} menit lalu` : `${Math.floor(diffMin / 60)} jam lalu`
                  
                  allCommits.push({
                    id: proof.id,
                    address: proof.bidder_address,
                    amount: proof.verified ? proof.nominal_bid : undefined,
                    time: timeStr,
                    timestamp: pDate.getTime()
                  })
                })
              }
            } catch (err) {
              console.warn(`Gagal memuat proof untuk item ${item.item_id}:`, err)
            }
          }
          allCommits.sort((a, b) => b.timestamp - a.timestamp)
          setGlobalCommits(allCommits)
        }
      } catch (err) {
        console.error('Gagal memuat data lelang dari backend:', err)
      }
    }
    fetchAuctionsAndCommits()
  }, [])

  // Timer to update timeLeft every second
  useEffect(() => {
    if (assets.length === 0) return
    const timer = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        timeLeft: formatTimeLeft(asset.endTime)
      })))
    }, 1000)
    return () => clearInterval(timer)
  }, [assets.length])

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
    { label: 'Volume Penawaran', value: `${totalVolume.toFixed(2)} STAKE`, icon: 'bar_chart', color: 'text-secondary' },
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
                        <span className="text-primary text-sm font-bold">{asset.currentBid.toLocaleString('id-ID', { minimumFractionDigits: 2 })} STAKE</span>
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
                        {commit.amount !== undefined ? `${commit.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })} STAKE` : 'Sealed 🔒'}
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
                Terhubung ke Jaringan Lelang Blockchain
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
