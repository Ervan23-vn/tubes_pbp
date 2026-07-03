import { useState } from 'react'
import { getStoredWalletAddress } from '../utils/keplr'

// =============================================
// DATA SIMULASI LENGKAP
// =============================================

const MOCK_ASSETS = [
  {
    id: 'ITEM-001',
    name: 'MacBook Pro M3 Max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    timeLeft: '2 hari 14 jam',
    type: 'ZKP Sealed-Bid',
    standard: 'Cosmos SDK',
  },
  {
    id: 'ITEM-002',
    name: 'Rolex Submariner Date',
    image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=800&q=80',
    timeLeft: '1 hari 6 jam',
    type: 'ZKP Sealed-Bid',
    standard: 'Cosmos SDK',
  },
  {
    id: 'ITEM-003',
    name: 'Vintage Gibson Les Paul 1959',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    timeLeft: '18 jam',
    type: 'ZKP Sealed-Bid',
    standard: 'Cosmos SDK',
  },
  {
    id: 'ITEM-004',
    name: 'NFT CryptoPunk #7804',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    timeLeft: '3 hari 2 jam',
    type: 'ZKP Sealed-Bid',
    standard: 'Cosmos SDK',
  },
]

// Pre-built mock participants per asset (keyed by asset id)
const MOCK_PARTICIPANTS = {
  'ITEM-001': [
    { address: 'cosmos1qx7z...a4f2', amount: 320.5000, hash: '0x7b23c21a...a8c9e3f1', isUser: false },
    { address: 'cosmos1m9kp...d8e7', amount: 285.0000, hash: '0x9f1a234b...4d3b71c2', isUser: false },
    { address: 'cosmos1v3hn...c1b9', amount: 250.7500, hash: '0x3c2e1f4a...8f9a04d5', isUser: false },
    { address: 'cosmos1jw82...f6a3', amount: 210.2500, hash: '0x1d4c2b9a...7b8a92e6', isUser: false },
    { address: 'cosmos1tn5r...e2d4', amount: 195.0000, hash: '0xa8f3c7d1...2e4b56f9', isUser: false },
    { address: 'cosmos1pk4e...b7c1', amount: 180.1200, hash: '0x5d9e2a3f...c1d8e4a7', isUser: false },
    { address: 'cosmos1rs6w...a9f5', amount: 150.0000, hash: '0x2b7f1c8e...9a3d5e12', isUser: false },
  ],
  'ITEM-002': [
    { address: 'cosmos1hf4d...e7b2', amount: 1250.0000, hash: '0xab12cd34...ef56gh78', isUser: false },
    { address: 'cosmos1kg9a...c3d5', amount: 1100.5000, hash: '0x12ef34ab...cd56ef78', isUser: false },
    { address: 'cosmos1lp7m...f8e1', amount: 980.0000, hash: '0x34cd56ef...ab78gh12', isUser: false },
    { address: 'cosmos1qs2n...d4a6', amount: 875.2500, hash: '0x56ab78cd...ef12gh34', isUser: false },
    { address: 'cosmos1wt8r...b1c3', amount: 720.0000, hash: '0x78ef12ab...cd34ef56', isUser: false },
  ],
  'ITEM-003': [
    { address: 'cosmos1zx3v...g2h4', amount: 450.0000, hash: '0xf1e2d3c4...b5a69780', isUser: false },
    { address: 'cosmos1ay5u...j6k8', amount: 420.7500, hash: '0xd3c4b5a6...97801f2e', isUser: false },
    { address: 'cosmos1bw7t...l0m2', amount: 380.0000, hash: '0xb5a69780...1f2ed3c4', isUser: false },
    { address: 'cosmos1cx9s...n4o6', amount: 350.5000, hash: '0x97801f2e...d3c4b5a6', isUser: false },
    { address: 'cosmos1dz1r...p8q0', amount: 310.0000, hash: '0x1f2ed3c4...b5a69780', isUser: false },
    { address: 'cosmos1ev3q...r2s4', amount: 275.0000, hash: '0xe3d4c5b6...a7980f1e', isUser: false },
  ],
  'ITEM-004': [
    { address: 'cosmos1fw5p...t6u8', amount: 5200.0000, hash: '0xaa11bb22...cc33dd44', isUser: false },
    { address: 'cosmos1gx7o...v0w2', amount: 4800.0000, hash: '0xbb22cc33...dd44ee55', isUser: false },
    { address: 'cosmos1hy9n...x4y6', amount: 4350.5000, hash: '0xcc33dd44...ee55ff66', isUser: false },
    { address: 'cosmos1iz1m...z8a0', amount: 3900.0000, hash: '0xdd44ee55...ff66aa11', isUser: false },
    { address: 'cosmos1ja3l...b2c4', amount: 3500.2500, hash: '0xee55ff66...aa11bb22', isUser: false },
    { address: 'cosmos1kb5k...d6e8', amount: 3100.0000, hash: '0xff66aa11...bb22cc33', isUser: false },
    { address: 'cosmos1lc7j...f0g2', amount: 2750.0000, hash: '0xa1b2c3d4...e5f6a7b8', isUser: false },
    { address: 'cosmos1md9i...h4i6', amount: 2200.0000, hash: '0xc3d4e5f6...a7b8c9d0', isUser: false },
  ],
}

// =============================================
// HELPER: Render profile initials circle
// =============================================
const renderPPBiasa = (address, isUser) => {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    'from-red-500/20 to-orange-500/20 text-orange-400 border-orange-500/35',
    'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/35',
    'from-green-500/20 to-emerald-500/20 text-emerald-400 border-emerald-500/35',
    'from-purple-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/35',
    'from-pink-500/20 to-rose-500/20 text-rose-400 border-rose-500/35',
  ]
  const colorClass = isUser
    ? 'from-primary/20 to-secondary/20 text-primary border-primary/40'
    : colors[hash % colors.length]

  // Extract 2-char initials from cosmos address
  const raw = address.replace('cosmos1', '').replace(/\.\.\./g, '')
  const initials = raw.substring(0, 2).toUpperCase() || 'XX'

  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br border flex items-center justify-center font-label-mono text-[10px] font-bold shrink-0 ${colorClass}`}>
      {initials}
    </div>
  )
}

// =============================================
// COMPONENT
// =============================================
export default function LeaderboardPage() {
  const walletAddress = getStoredWalletAddress()
  const [selectedAssetId, setSelectedAssetId] = useState(MOCK_ASSETS[0].id)

  const selectedAsset = MOCK_ASSETS.find((a) => a.id === selectedAssetId)

  // Build participants: mock data + user's own bid from localStorage
  const getParticipants = () => {
    if (!selectedAsset) return []

    // Start with mock participants for this asset
    const list = [...(MOCK_PARTICIPANTS[selectedAsset.id] || [])]

    // Inject the current user's bid (from localStorage) if they have one for this asset
    const existing = localStorage.getItem('bid_history')
    if (existing) {
      try {
        const bids = JSON.parse(existing)
        const userBid = bids.find((b) => b.assetName === selectedAsset.name || b.itemId === selectedAsset.id)
        if (userBid) {
          const formattedAddr = walletAddress
            ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 4)}`
            : 'cosmos1anda...user'
          list.push({
            address: formattedAddr,
            amount: userBid.amount,
            hash: userBid.hash
              ? `${userBid.hash.substring(0, 10)}...${userBid.hash.substring(userBid.hash.length - 4)}`
              : '0x....',
            isUser: true,
          })
        }
      } catch (e) { /* ignore parse errors */ }
    }

    // Sort by bid amount descending
    return list.sort((a, b) => b.amount - a.amount)
  }

  const participants = getParticipants()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Blockchain Leaderboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            Peringkat Penawaran Lelang
          </h1>
          <p className="text-gray-500 text-xs mt-2">
            Papan peringkat transparansi penawaran lelang secara real-time berdasarkan data yang tercatat di blockchain.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Aset</div>
          <div className="text-2xl font-bold text-gray-800">{MOCK_ASSETS.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Peserta</div>
          <div className="text-2xl font-bold text-gray-800">{participants.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Bid Tertinggi</div>
          <div className="text-2xl font-bold text-secondary">{participants.length > 0 ? participants[0].amount.toFixed(2) : '0'} <span className="text-sm text-gray-400">ATOM</span></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Status</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-green-600">Lelang Aktif</span>
          </div>
        </div>
      </div>

      {/* Asset Filter Selector */}
      <div className="bg-white border border-gray-200 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl select-none">filter_list</span>
          <div>
            <h3 className="text-sm text-gray-800 font-semibold">Pilih Aset Lelang</h3>
            <p className="text-[10px] text-gray-400">Peringkat dihitung per item lelang</p>
          </div>
        </div>

        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="w-full md:w-72 bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 text-xs p-3 rounded-lg outline-none transition-colors cursor-pointer"
        >
          {MOCK_ASSETS.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.id})
            </option>
          ))}
        </select>
      </div>

      {/* Leaderboard Table Card */}
      {selectedAsset && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Asset Summary Banner */}
          <div className="p-5 bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                <img src={selectedAsset.image} alt={selectedAsset.name} className="w-full h-full object-cover opacity-80" />
              </div>
              <div>
                <h2 className="text-base text-white font-bold">{selectedAsset.name}</h2>
                <p className="text-[10px] text-primary">{selectedAsset.type} • {selectedAsset.standard}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <p className="text-[9px] text-slate-400 uppercase">Waktu Tersisa</p>
                <p className="text-sm text-[#fbbf24] font-bold tracking-wider">{selectedAsset.timeLeft}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase">Partisipan</p>
                <p className="text-sm text-white font-bold">{participants.length} bidder</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Peringkat</th>
                  <th className="py-4 px-6">Profil</th>
                  <th className="py-4 px-6">Alamat Wallet</th>
                  <th className="py-4 px-6">Hash Komitmen</th>
                  <th className="py-4 px-6 text-right">Nilai Penawaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((participant, index) => {
                  const isGold = index === 0
                  const isSilver = index === 1
                  const isBronze = index === 2

                  return (
                    <tr
                      key={`${participant.hash}-${index}`}
                      className={`transition-colors hover:bg-gray-50 ${
                        participant.isUser ? 'bg-primary/5 hover:bg-primary/10' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        {isGold ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30 font-bold text-xs select-none shadow-sm">🥇</span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#94a3b8]/20 text-[#94a3b8] border border-[#94a3b8]/30 font-bold text-xs select-none shadow-sm">🥈</span>
                        ) : isBronze ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#b45309]/20 text-[#b45309] border border-[#b45309]/30 font-bold text-xs select-none shadow-sm">🥉</span>
                        ) : (
                          <span className="text-gray-400 font-bold">{index + 1}</span>
                        )}
                      </td>

                      {/* Profile Initials */}
                      <td className="py-4 px-6">
                        {renderPPBiasa(participant.address, participant.isUser)}
                      </td>

                      {/* Address */}
                      <td className="py-4 px-6 font-mono text-gray-800 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{participant.address}</span>
                          {participant.isUser && (
                            <span className="px-2 py-0.5 rounded text-[8px] bg-primary/20 text-primary border border-primary/30 font-bold uppercase tracking-wider select-none">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hash */}
                      <td className="py-4 px-6 font-mono text-gray-400 text-[11px]">
                        {participant.hash}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-bold ${isGold ? 'text-[#fbbf24]' : isSilver ? 'text-gray-500' : isBronze ? 'text-[#b45309]' : 'text-secondary'}`}>
                          {participant.amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </span>
                        <span className="text-gray-400 text-[10px] ml-1">ATOM</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
              Data simulasi — akan terhubung ke blockchain saat backend aktif
            </p>
            <p className="text-[10px] text-gray-400">
              Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
