import { useState, useEffect } from 'react'
import { getStoredWalletAddress } from '../utils/keplr'
import { auctionsAPI, zkpAPI } from '../utils/api'

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
  const [assets, setAssets] = useState([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  const formatTimeLeftSimple = (endTimeStr) => {
    if (!endTimeStr) return 'Selesai'
    const diff = new Date(endTimeStr) - new Date()
    if (diff <= 0) return 'Selesai'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) {
      return `${days} hari ${hours} jam`
    }
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
  }

  // Load active auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await auctionsAPI.getAll()
        if (response && response.success && Array.isArray(response.data)) {
          const mapped = response.data.map(item => ({
            id: item.item_id,
            name: item.title,
            image: item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            timeLeft: formatTimeLeftSimple(item.end_time),
            endTime: item.end_time,
            type: 'ZKP Sealed-Bid',
            standard: 'Cosmos SDK'
          }))
          setAssets(mapped)
          if (mapped.length > 0) {
            setSelectedAssetId(mapped[0].id)
          }
        }
      } catch (err) {
        console.error('Gagal memuat data lelang untuk leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAuctions()
  }, [])

  // Load participants for the selected auction
  useEffect(() => {
    if (!selectedAssetId) return

    const fetchParticipants = async () => {
      try {
        const response = await zkpAPI.getProofsForAuction(selectedAssetId)
        if (response && response.success && Array.isArray(response.data)) {
          const list = response.data.map(proof => {
            const isUser = walletAddress && proof.bidder_address.toLowerCase() === walletAddress.toLowerCase()
            
            let amount = undefined
            let hashStr = proof.commitment_hash
            
            if (isUser) {
              const existing = localStorage.getItem('bid_history')
              if (existing) {
                try {
                  const bids = JSON.parse(existing)
                  const userBid = bids.find(b => b.itemId === selectedAssetId)
                  if (userBid) {
                    amount = userBid.amount
                    hashStr = userBid.hash || proof.commitment_hash
                  }
                } catch (e) {}
              }
            }

            const formattedAddr = proof.bidder_address
              ? `${proof.bidder_address.substring(0, 10)}...${proof.bidder_address.substring(proof.bidder_address.length - 4)}`
              : 'cosmos1...'

            return {
              address: formattedAddr,
              fullAddress: proof.bidder_address,
              amount: amount,
              hash: hashStr ? `${hashStr.substring(0, 10)}...${hashStr.substring(hashStr.length - 4)}` : '0x....',
              isUser: isUser,
              timestamp: new Date(proof.proof_generated_at).getTime()
            }
          })

          list.sort((a, b) => {
            if (a.amount !== undefined && b.amount !== undefined) {
              return b.amount - a.amount
            }
            if (a.amount !== undefined) return -1
            if (b.amount !== undefined) return 1
            return b.timestamp - a.timestamp
          })

          setParticipants(list)
        }
      } catch (err) {
        console.error('Gagal memuat data partisipan dari backend:', err)
        setParticipants([])
      }
    }

    fetchParticipants()
  }, [selectedAssetId, walletAddress])

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
          <div className="text-2xl font-bold text-gray-800">{assets.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Peserta</div>
          <div className="text-2xl font-bold text-gray-800">{participants.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Bid Tertinggi</div>
          <div className="text-2xl font-bold text-secondary">
            {participants.length > 0 && participants[0].amount !== undefined 
              ? `${participants[0].amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })} STAKE` 
              : 'Sealed 🔒'}
          </div>
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
          {assets.map((asset) => (
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
                          {participant.amount !== undefined 
                            ? participant.amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                            : 'Sealed 🔒'}
                        </span>
                        {participant.amount !== undefined && <span className="text-gray-400 text-[10px] ml-1">STAKE</span>}
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
              Terhubung ke Jaringan Lelang Blockchain secara Real-Time
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
