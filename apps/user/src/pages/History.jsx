import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredWalletAddress } from '../utils/keplr'

// Helper to determine deterministically if the user's bid is the highest for a given asset
const getIsHighestBidForAsset = (assetName, userAmount) => {
  const seed = assetName.charCodeAt(0) + (assetName.charCodeAt(1) || 0) || 100
  
  if (userAmount > 10) {
    // For large values (like 1650, 750)
    const base = userAmount > 1000 ? 1600 : userAmount > 500 ? 900 : 40;
    return userAmount >= base;
  }

  // Deterministic amounts for other participants
  const rawList = [
    { amount: 0.1500 },
    { amount: 0.2200 },
    { amount: 0.1800 },
    { amount: 0.2500 },
  ]
  const otherAmounts = rawList.map((p, i) => {
    const diff = ((seed + i * 17) % 15) / 100
    return parseFloat((0.12 + diff).toFixed(4))
  })
  
  const maxOtherAmount = Math.max(...otherAmounts)
  return userAmount >= maxOtherAmount
}

export default function History() {
  const navigate = useNavigate()
  const walletAddress = getStoredWalletAddress()
  const walletConnected = !!walletAddress

  const [bidsSubmitted, setBidsSubmitted] = useState([])
  const [refundedBids, setRefundedBids] = useState([])
  const [claimedBids, setClaimedBids] = useState([])

  useEffect(() => {
    // Load submitted bids from localStorage, or initialize with mock data if empty for dev
    let storedBids = localStorage.getItem('bid_history')
    if (storedBids) {
      try {
        setBidsSubmitted(JSON.parse(storedBids))
      } catch (e) {
        console.error(e)
      }
    } else {
      // Mock data for development
      const defaultMockBids = [
        {
          timestamp: '2026-07-01 10:30:15',
          assetName: 'MacBook Pro M3 Max 16-inch 36GB 1TB Space Black',
          amount: 1650.0000,
          revealed: true,
          hash: '5f4dcc3b5aa765d61d8327deb882cf99f2b8b99bbccaa887766554433221100'
        },
        {
          timestamp: '2026-07-01 11:15:22',
          assetName: 'Lukisan Abstrak Modern "Cosmic Harmony" Original Canvas',
          amount: 750.0000,
          revealed: true,
          hash: '7c6a5a4f3e2d1c0b9a8f7e6d5c4b3a2100112233445566778899aabbccddeeff'
        },
        {
          timestamp: '2026-07-01 12:00:00',
          assetName: 'Cosmos ATOM Custom Neon Light Sign LED',
          amount: 45.0000,
          revealed: false,
          hash: '8f7e6d5c4b3a2100112233445566778899aabbccddeeff001122334455667788'
        }
      ]
      setBidsSubmitted(defaultMockBids)
      localStorage.setItem('bid_history', JSON.stringify(defaultMockBids))
    }

    // Load refunded bids
    const storedRefunds = localStorage.getItem('refunded_bids')
    if (storedRefunds) {
      try {
        setRefundedBids(JSON.parse(storedRefunds))
      } catch (e) {}
    }

    // Load claimed bids
    const storedClaims = localStorage.getItem('claimed_bids')
    if (storedClaims) {
      try {
        setClaimedBids(JSON.parse(storedClaims))
      } catch (e) {}
    }
  }, [])

  const handleWithdrawRefund = (amount, timestamp) => {
    const updated = [...refundedBids, timestamp]
    setRefundedBids(updated)
    localStorage.setItem('refunded_bids', JSON.stringify(updated))
    alert(`Sukses menarik kembali jaminan dana sebesar ${amount.toFixed(4)} STAKE ke dompet Keplr Anda!`)
  }

  const handleClaimAsset = (timestamp, assetName) => {
    const updated = [...claimedBids, timestamp]
    setClaimedBids(updated)
    localStorage.setItem('claimed_bids', JSON.stringify(updated))
    alert(`Sukses mengklaim kepemilikan aset digital "${assetName}"!`)
  }

  const handleGoToReveal = () => {
    navigate('/marketplace')
  }

  // Format user address
  const formattedUserAddress = walletAddress
    ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 4)}`
    : 'cosmos....'

  // Sort bids by amount descending
  const sortedBids = [...bidsSubmitted].sort((a, b) => b.amount - a.amount)

  // 1. Wallet Disconnected State
  if (!walletConnected) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="border-b border-outline-variant/10 pb-6 mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
              Winner & Claims Portal
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
              Hasil Lelang & Klaim
            </h1>
          </div>
        </div>

        <div className="glass-panel border border-outline-variant/10 p-8 rounded-xl flex flex-col items-center justify-center text-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-outline-variant">
            <span className="material-symbols-outlined text-4xl select-none">wallet</span>
          </div>
          <div className="space-y-1 max-w-[320px]">
            <h3 className="font-stats-display text-base text-on-surface">Dompet Belum Terhubung</h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Hubungkan Keplr Wallet Anda terlebih dahulu untuk memuat data partisipasi lelang Anda.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Empty Bids State
  if (bidsSubmitted.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="border-b border-outline-variant/10 pb-6 mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
              Winner & Claims Portal
            </div>
            <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
              Hasil Lelang & Klaim
            </h1>
          </div>
        </div>

        <div className="glass-panel border border-outline-variant/10 p-8 rounded-xl flex flex-col items-center justify-center text-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-outline-variant">
            <span className="material-symbols-outlined text-4xl select-none">explore</span>
          </div>
          <div className="space-y-1 max-w-[380px]">
            <h3 className="font-stats-display text-base text-on-surface">Belum Ada Aktivitas Lelang</h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              Anda belum mengirimkan penawaran komitmen apa pun pada sesi ini. Riwayat lelang dan peringkat lelang akan muncul di sini setelah Anda mengajukan penawaran.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-outline-variant/10 pb-6 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Winner & Claims Portal
          </div>
          <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            Hasil Lelang & Klaim
          </h1>
          <p className="text-on-surface-variant font-label-mono text-xs mt-2">
            Pantau hasil lelang, klaim aset digital Anda, atau tarik kembali dana jaminan yang terkunci.
          </p>
        </div>
      </div>

      {/* Render each submitted bid as a separate auction card */}
      {sortedBids.map((bid, index) => {
        const isRefunded = refundedBids.includes(bid.timestamp)
        const isClaimed = claimedBids.includes(bid.timestamp)
        const isRevealed = bid.revealed
        const isHighest = getIsHighestBidForAsset(bid.assetName, bid.amount)

        return (
          <div key={bid.timestamp} className="glass-panel border border-outline-variant/10 rounded-xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-4 duration-300 bg-white">
            {/* Auction Banner */}
            <div className="p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-outline-variant/10 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#fbbf24]/5 via-transparent to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                  !isRevealed 
                    ? 'bg-[#fbbf24]/20 border-[#fbbf24]/40 text-[#fbbf24]' 
                    : isHighest 
                      ? 'bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]' 
                      : 'bg-red-100 border-red-200 text-red-600'
                }`}>
                  <span className="material-symbols-outlined text-2xl select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {!isRevealed ? 'lock' : isHighest ? 'emoji_events' : 'trending_down'}
                  </span>
                </div>
                <div>
                  <h2 className={`font-headline-lg text-base sm:text-lg uppercase tracking-wider font-bold ${
                    !isRevealed 
                      ? 'text-[#fbbf24]' 
                      : isHighest 
                        ? 'text-[#10b981]' 
                        : 'text-red-600'
                  }`}>
                    {!isRevealed 
                      ? 'Menunggu Pembukaan (Reveal)' 
                      : isHighest 
                        ? 'Lelang Selesai — Anda Menang' 
                        : 'Lelang Selesai — Tawaran Terlampaui'}
                  </h2>
                  <p className="font-body-md text-xs text-gray-500">
                    Aset • "{bid.assetName}"
                  </p>
                </div>
              </div>
              
              {/* Top nominal display */}
              <div className="glass-panel px-5 py-3 rounded border-outline-variant/20 text-center relative z-10 bg-gray-50 border">
                <p className="font-label-mono text-[9px] text-gray-500 mb-1 uppercase tracking-widest">
                  Nominal Komitmen
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <p className="font-stats-display text-lg text-blue-600 font-bold">
                    {bid.amount.toFixed(4)} STAKE
                  </p>
                </div>
              </div>
            </div>

            {/* Action & Detail Grid (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/10">
              {/* 1. Action Card (Left) */}
              <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between min-h-[220px]">
                {!isRevealed ? (
                  /* Unrevealed State — User must reveal first */
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="material-symbols-outlined text-[#fbbf24] text-2xl select-none">lock</span>
                        <h3 className="font-stats-display text-base text-gray-800 font-semibold">Penawaran Terkunci</h3>
                      </div>
                      <p className="font-body-md text-xs text-gray-600 leading-relaxed">
                        Penawaran Anda pada "{bid.assetName}" masih berstatus hash rahasia di blockchain. Buka isi penawaran Anda di menu Reveal Portal terlebih dahulu agar peringkat pemenang lelang dapat dihitung.
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] active:scale-[0.98] text-black font-label-mono text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all font-bold flex items-center justify-center gap-2 cursor-pointer"
                        onClick={handleGoToReveal}
                      >
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        Buka di Reveal Portal
                      </button>
                    </div>
                  </div>
                ) : isHighest ? (
                  /* Revealed & Highest — Winner Card */
                  <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                    <div>
                      <div className="flex items-center gap-3 mb-3 text-[#10b981]">
                        <span className="material-symbols-outlined text-2xl select-none" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                        <h3 className="font-stats-display text-base font-bold uppercase tracking-wider">Lelang Dimenangkan!</h3>
                      </div>
                      <p className="font-body-md text-xs text-gray-600 leading-relaxed">
                        Selamat! Penawaran Anda sebesar <strong>{bid.amount.toFixed(4)} STAKE</strong> adalah yang tertinggi untuk aset "{bid.assetName}". Anda dapat mengklaim kepemilikan aset digital ini sekarang.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4 bg-gray-55 px-4 py-3 border border-outline-variant/10 rounded-lg text-xs font-label-mono bg-gray-50 border">
                        <span className="text-gray-500">HARGA AKHIR</span>
                        <span className="text-gray-800 font-bold">{bid.amount.toFixed(4)} STAKE</span>
                      </div>
                      {isClaimed ? (
                        <div className="w-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 py-3 rounded-lg font-label-mono text-xs uppercase tracking-wider text-center font-bold">
                          Aset Berhasil Diklaim
                        </div>
                      ) : (
                        <button
                          className="w-full bg-[#10b981] hover:brightness-110 active:scale-[0.98] text-white font-label-mono text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all font-bold flex items-center justify-center gap-2 cursor-pointer"
                          onClick={() => {
                            handleClaimAsset(bid.timestamp, bid.assetName)
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Klaim Kepemilikan Aset
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Revealed & Lower — Refund Card */
                  <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
                    <div>
                      <div className="flex items-center gap-3 mb-3 text-red-600">
                        <span className="material-symbols-outlined text-2xl select-none">trending_down</span>
                        <h3 className="font-stats-display text-base font-bold uppercase tracking-wider">Tawaran Terlampaui (Kalah)</h3>
                      </div>
                      <p className="font-body-md text-xs text-gray-600 leading-relaxed">
                        Penawaran Anda sebesar <strong>{bid.amount.toFixed(4)} STAKE</strong> telah terlampaui oleh penawar lain. Silakan tarik kembali dana jaminan Anda ke dompet.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-4 bg-gray-50 px-4 py-3 border border-outline-variant/10 rounded-lg text-xs font-label-mono border">
                        <span className="text-gray-500">DANA TERKUNCI</span>
                        <span className="text-gray-800 font-bold">{bid.amount.toFixed(4)} STAKE</span>
                      </div>
                      {isRefunded ? (
                        <div className="w-full bg-gray-100 border border-gray-200 text-gray-400 py-3 rounded-lg font-label-mono text-xs uppercase tracking-wider text-center">
                          Dana Pengembalian Sudah Ditarik
                        </div>
                      ) : (
                        <button
                          className="w-full bg-gray-800 hover:bg-gray-900 active:scale-[0.98] text-white font-label-mono text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          onClick={() => {
                            handleWithdrawRefund(bid.amount, bid.timestamp)
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                          Tarik Pengembalian Dana
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Bid Detail (Right) */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-stats-display text-sm text-gray-800 font-semibold">Detail Penawaran</h3>
                    <span className="font-label-mono text-[10px] text-gray-400">#{index + 1}</span>
                  </div>

                  <div className="bg-gray-50 border border-outline-variant/10 rounded-lg overflow-hidden border">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Aset</td>
                          <td className="py-3.5 px-5 font-label-mono text-gray-800 font-semibold">{bid.assetName}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Alamat Wallet</td>
                          <td className="py-3.5 px-5 font-label-mono text-gray-800 flex items-center gap-2">
                            <span className="select-all font-mono">{formattedUserAddress}</span>
                            <span className="px-2 py-0.5 rounded text-[8px] bg-blue-100 text-blue-800 border border-blue-200 font-bold uppercase tracking-wider">
                              Anda
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Jumlah Tawaran</td>
                          <td className="py-3.5 px-5 font-label-mono text-blue-600 font-bold">
                            {bid.amount.toFixed(4)} STAKE
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Hash Komitmen</td>
                          <td className="py-3.5 px-5 font-label-mono text-gray-800 font-mono">
                            {bid.hash ? `${bid.hash.substring(0, 8)}...${bid.hash.substring(bid.hash.length - 4)}` : ''}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Status Verifikasi</td>
                          <td className="py-3.5 px-5 font-label-mono">
                            {!isRevealed ? (
                              <span className="px-2.5 py-1 rounded bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 text-[10px] uppercase font-bold tracking-wider animate-pulse">
                                TERKUNCI (Belum Reveal)
                              </span>
                            ) : isHighest ? (
                              <span className="px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[10px] uppercase font-bold tracking-wider">
                                🏆 Menang (Tertinggi)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-red-100 text-red-600 border border-red-200 text-[10px] uppercase font-bold tracking-wider">
                                ❌ Kalah (Siap Refund)
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3.5 px-5 font-label-mono text-gray-500">Waktu Kirim</td>
                          <td className="py-3.5 px-5 font-label-mono text-gray-800">{bid.timestamp}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
