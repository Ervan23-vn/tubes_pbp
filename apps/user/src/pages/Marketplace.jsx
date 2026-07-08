import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredWalletAddress } from '../utils/keplr'
import { auctionsAPI, zkpAPI } from '../utils/api'

// Category mapping for display
const CATEGORY_MAP = {
  hardware: {
    label: 'Hardware', emoji: '🔧', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
    subcategories: {
      'hw-pc-component': { label: 'PC Components', icon: 'memory' },
      'hw-laptop-desktop': { label: 'Laptop & Desktop', icon: 'laptop_mac' },
      'hw-networking': { label: 'Networking', icon: 'router' },
      'hw-storage': { label: 'Storage & Memory', icon: 'storage' },
      'hw-peripheral': { label: 'Peripherals', icon: 'keyboard' },
      'hw-server': { label: 'Server & Enterprise', icon: 'dns' },
    }
  },
  software: {
    label: 'Software', emoji: '💿', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200',
    subcategories: {
      'sw-os': { label: 'Operating System', icon: 'terminal' },
      'sw-devtools': { label: 'Dev Tools', icon: 'code' },
      'sw-productivity': { label: 'Productivity', icon: 'edit_document' },
      'sw-cloud': { label: 'Cloud & SaaS', icon: 'cloud' },
      'sw-game-media': { label: 'Game & Media', icon: 'sports_esports' },
      'sw-security': { label: 'Security', icon: 'shield' },
    }
  }
};

const CONDITION_MAP = {
  'new': { label: 'Baru', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'like_new': { label: 'Like New', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'good': { label: 'Bekas - Baik', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'refurbished': { label: 'Refurbished', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
};

// Helper to resolve image URL with Backend address if relative
const getImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url : '/' + url;
  return `http://localhost:3001${cleanUrl}`;
};

function getSubcategoryLabel(subCode) {
  for (const cat of Object.values(CATEGORY_MAP)) {
    if (cat.subcategories[subCode]) return cat.subcategories[subCode].label;
  }
  return subCode;
}

function getSubcategoryIcon(subCode) {
  for (const cat of Object.values(CATEGORY_MAP)) {
    if (cat.subcategories[subCode]) return cat.subcategories[subCode].icon;
  }
  return 'category';
}

function getCategoryInfo(mainCat) {
  return CATEGORY_MAP[mainCat] || CATEGORY_MAP.hardware;
}

// =============================================
// COMPONENT
// =============================================

export default function Marketplace() {
  const navigate = useNavigate()
  const [assets, setAssets] = useState([])
  const [globalCommits, setGlobalCommits] = useState([])
  const [activeMainFilter, setActiveMainFilter] = useState('all')
  const [activeSubFilter, setActiveSubFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
            image: getImageUrl(item.image_url),
            main_category: item.main_category || 'hardware',
            sub_category: item.sub_category || 'hw-pc-component',
            item_condition: item.item_condition || 'new',
            brand: item.brand || '',
            specifications: item.specifications,
            warranty_info: item.warranty_info,
            endTime: item.end_time,
            timeLeft: formatTimeLeft(item.end_time),
            currentBid: item.current_highest_bid || item.starting_price || 0,
            startingPrice: item.starting_price || 0,
            totalBids: item.total_bids_count || 0,
            status: item.auction_status,
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
  const hardwareCount = assets.filter(a => a.main_category === 'hardware').length
  const softwareCount = assets.filter(a => a.main_category === 'software').length

  const stats = [
    { label: 'Total Aset Aktif', value: totalAssets, icon: 'devices', color: 'text-blue-500' },
    { label: 'Hardware', value: hardwareCount, icon: 'memory', color: 'text-amber-500' },
    { label: 'Software', value: softwareCount, icon: 'apps', color: 'text-violet-500' },
    { label: 'Komitmen ZKP', value: totalCommits, icon: 'lock', color: 'text-emerald-500' },
  ]

  // Get subcategories for current main filter
  const currentSubcategories = activeMainFilter !== 'all' 
    ? CATEGORY_MAP[activeMainFilter]?.subcategories || {}
    : {};

  // Filter assets
  const filteredAssets = assets.filter(a => {
    const matchMain = activeMainFilter === 'all' || a.main_category === activeMainFilter;
    const matchSub = activeSubFilter === 'all' || a.sub_category === activeSubFilter;
    const matchSearch = !searchQuery || 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMain && matchSub && matchSearch;
  });

  const handleCommitBid = (asset) => {
    navigate(`/auctions/${asset.id}/bid`)
  }

  const handleMainFilterChange = (filter) => {
    setActiveMainFilter(filter);
    setActiveSubFilter('all'); // Reset sub filter
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="border-b border-gray-200 pb-6 mb-2">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            IT Electronics Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 uppercase tracking-wider leading-none">
            Lelang Barang Elektronik IT
          </h1>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Marketplace lelang Hardware & Software bidang Informatika — Beroperasi di jaringan blockchain
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
          <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 mb-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2 className="text-lg md:text-xl text-gray-800 font-bold">Aset Lelang Aktif</h2>

              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari barang atau merek..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs w-56 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Main Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleMainFilterChange('all')}
                className={`px-3.5 py-1.5 rounded-lg border text-[10px] sm:text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeMainFilter === 'all'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-300 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                🖥️ Semua Kategori
              </button>
              <button
                onClick={() => handleMainFilterChange('hardware')}
                className={`px-3.5 py-1.5 rounded-lg border text-[10px] sm:text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeMainFilter === 'hardware'
                    ? 'bg-amber-500/10 text-amber-700 border-amber-300 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                🔧 Hardware
              </button>
              <button
                onClick={() => handleMainFilterChange('software')}
                className={`px-3.5 py-1.5 rounded-lg border text-[10px] sm:text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeMainFilter === 'software'
                    ? 'bg-violet-500/10 text-violet-700 border-violet-300 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                💿 Software
              </button>
            </div>

            {/* Sub-Category Filter (only visible when a main category is selected) */}
            {activeMainFilter !== 'all' && Object.keys(currentSubcategories).length > 0 && (
              <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => setActiveSubFilter('all')}
                  className={`px-3 py-1 rounded-md border text-[9px] sm:text-[10px] transition-all cursor-pointer whitespace-nowrap ${
                    activeSubFilter === 'all'
                      ? 'bg-gray-800 text-white border-gray-800 font-semibold'
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  Semua
                </button>
                {Object.entries(currentSubcategories).map(([key, sub]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSubFilter(key)}
                    className={`px-3 py-1 rounded-md border text-[9px] sm:text-[10px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      activeSubFilter === key
                        ? 'bg-gray-800 text-white border-gray-800 font-semibold'
                        : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[11px]">{sub.icon}</span>
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </header>

          {/* Cards Grid */}
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center justify-center text-center py-16 gap-3 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-gray-300">info</span>
              <p className="text-sm text-gray-600">Tidak ada barang elektronik dalam kategori ini.</p>
              <p className="text-xs text-gray-400">Coba pilih kategori lain atau hapus filter pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-300">
              {filteredAssets.map((asset) => {
                const catInfo = getCategoryInfo(asset.main_category);
                const condInfo = CONDITION_MAP[asset.item_condition] || CONDITION_MAP['new'];
                let specs = {};
                try { specs = asset.specifications ? JSON.parse(asset.specifications) : {}; } catch {}
                const specEntries = Object.entries(specs).slice(0, 2);

                return (
                  <div
                    key={asset.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-blue-200 transition-all duration-300 group"
                  >
                    {/* Progress bar */}
                    <div className="h-1 w-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          asset.timeLeft === '00:00:00' ? 'bg-gray-400' :
                          asset.timeLeft.startsWith('00:0') ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                        }`}
                        style={{
                          width: asset.timeLeft === '00:00:00' ? '100%' : asset.timeLeft.startsWith('00') ? '30%' : '75%',
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
                      {/* Category Badge */}
                      <div className={`absolute top-2 left-2 ${catInfo.bgColor} backdrop-blur-md border ${catInfo.borderColor} px-2 py-0.5 rounded text-[9px] ${catInfo.color} font-bold flex items-center gap-1`}>
                        {catInfo.emoji} {getSubcategoryLabel(asset.sub_category)}
                      </div>
                      {/* Condition Badge */}
                      <div className={`absolute top-2 right-2 ${condInfo.bg} backdrop-blur-md border ${condInfo.border} px-2 py-0.5 rounded text-[9px] ${condInfo.color} font-semibold`}>
                        {condInfo.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-3 flex-grow">
                      <div>
                        <h3 className="text-sm text-gray-800 font-bold mb-0.5 line-clamp-2 leading-snug">{asset.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-gray-400 font-mono">ID: {asset.id.substring(0, 8)}...</span>
                          {asset.brand && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] bg-gray-100 border border-gray-200 text-gray-500 font-bold uppercase">
                              {asset.brand}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specs Preview */}
                      {specEntries.length > 0 && (
                        <div className="bg-slate-50 border border-gray-100 rounded-lg p-2 space-y-0.5">
                          {specEntries.map(([key, val]) => (
                            <div key={key} className="flex justify-between text-[10px]">
                              <span className="text-gray-400">{key}</span>
                              <span className="text-gray-600 font-medium">{val}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-end mt-auto pt-3 border-t border-gray-100">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-gray-400">Tawaran Tertinggi</span>
                          <span className="text-blue-600 text-sm font-bold">{Number(asset.currentBid).toLocaleString('id-ID', { minimumFractionDigits: 2 })} LCT</span>
                        </div>
                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="text-[10px] text-gray-400">Sisa Waktu</span>
                          <span className={`text-xs font-mono ${
                            asset.timeLeft === '00:00:00' ? 'text-gray-400' :
                            asset.timeLeft.startsWith('00:0') ? 'text-red-500 font-bold' : 'text-emerald-600'
                          }`}>
                            {asset.timeLeft === '00:00:00' ? 'Selesai' : asset.timeLeft}
                          </span>
                        </div>
                      </div>

                      <button
                        className={`w-full ${asset.timeLeft === '00:00:00' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-indigo-600 cursor-pointer'} text-white active:scale-95 transition-all py-2.5 rounded-lg text-xs uppercase tracking-wider mt-1 font-bold flex justify-center items-center gap-2 shadow-sm`}
                        onClick={() => asset.timeLeft !== '00:00:00' && handleCommitBid(asset)}
                        disabled={asset.timeLeft === '00:00:00'}
                      >
                        {asset.timeLeft === '00:00:00' ? (
                          <>Lelang Selesai <span className="material-symbols-outlined text-[14px]">check_circle</span></>
                        ) : (
                          <>Ajukan Penawaran <span className="material-symbols-outlined text-[14px]">gavel</span></>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recent Commits Sidebar */}
        <aside className="w-full lg:w-4/12 xl:w-3/12 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Komitmen Terbaru (ZKP)
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
                      <span className="font-mono text-[11px] text-gray-700 group-hover:text-blue-600 transition-colors">
                        {commit.address.substring(0, 10)}...{commit.address.substring(commit.address.length - 4)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] text-blue-600 font-semibold">
                        {commit.amount !== undefined ? `${commit.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })} LCT` : 'Sealed 🔒'}
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
