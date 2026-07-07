<<<<<<< Updated upstream
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { auctionsAPI, zkpAPI } from '../utils/api'

// Helper to resolve image URL with Backend address if relative
const getImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url : '/' + url;
  return `http://localhost:3001${cleanUrl}`;
};

export default function AuctionDetail() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  
  const [auction, setAuction] = useState(null)
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchAuctionDetail()
  }, [itemId])

  const fetchAuctionDetail = async () => {
    try {
      setLoading(true)
      setError('')
      const [auctionRes, proofsRes] = await Promise.all([
        auctionsAPI.getById(itemId),
        zkpAPI.getProofsForAuction(itemId)
      ])

      if (auctionRes && auctionRes.success) {
        setAuction(auctionRes.data)
      } else {
        setError('Gagal memuat detail lelang')
      }

      if (proofsRes && proofsRes.success) {
        setProofs(proofsRes.data || [])
      }
    } catch (err) {
      console.error('Fetch auction detail error:', err)
      setError(err.message || 'Gagal memuat detail lelang')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimWin = async () => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')
      const res = await auctionsAPI.claim(itemId)
      if (res && res.success) {
        setSuccess('Selamat! Klaim barang berhasil dikirim ke blockchain.')
        fetchAuctionDetail()
      } else {
        setError(res.message || 'Klaim gagal dilakukan.')
      }
    } catch (err) {
      setError(err.message || 'Gagal mengklaim barang.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefundCollateral = async () => {
    try {
      setActionLoading(true)
      setError('')
      setSuccess('')
      const res = await auctionsAPI.refund(itemId)
      if (res && res.success) {
        setSuccess('Refund jaminan dana berhasil dikirim ke dompet Keplr Anda.')
        fetchAuctionDetail()
      } else {
        setError(res.message || 'Refund gagal dilakukan.')
      }
    } catch (err) {
      setError(err.message || 'Gagal menarik refund.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold font-mono">Memuat Aset Lelang...</p>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="text-center py-16 bg-white border border-gray-200 rounded-xl max-w-lg mx-auto shadow-sm">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-3">error</span>
        <p className="text-gray-800 font-bold text-lg">Lelang tidak ditemukan</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider hover:bg-secondary transition-colors"
        >
          Kembali ke Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-2">
        <div className="flex flex-col gap-1">
          <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Detail Aset Lelang
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            {auction.title}
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1">ID: {auction.item_id}</p>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="text-xs font-bold text-gray-500 hover:text-primary transition-colors border border-gray-200 hover:border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer bg-white"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Kembali
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs font-mono flex items-start gap-2.5 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-red-600 text-lg">warning</span>
          <div className="flex-grow">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 text-xs font-mono flex items-start gap-2.5 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
          <div className="flex-grow">{success}</div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Image Card */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="aspect-[4/3] bg-gray-100 relative">
            <img
              src={getImageUrl(auction.image_url)}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-primary">sell</span>
              {auction.category}
            </div>
          </div>
        </div>

        {/* Middle: Details */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Informasi Penawaran</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Status</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${
                auction.auction_status === 'active'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {auction.auction_status === 'active' ? '🟢 Aktif' : '⏹️ Selesai'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Bids</span>
              <span className="font-stats-display text-sm font-bold text-gray-800 block mt-1">{auction.total_bids_count}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Harga Dasar</span>
            <span className="text-lg font-extrabold text-gray-800 font-mono block mt-0.5">
              {parseFloat(auction.starting_price).toLocaleString('id-ID', { minimumFractionDigits: 2 })} STAKE
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Penawaran Tertinggi (Terungkap)</span>
            <span className="text-lg font-extrabold text-primary font-mono block mt-0.5">
              {auction.current_highest_bid 
                ? `${parseFloat(auction.current_highest_bid).toLocaleString('id-ID', { minimumFractionDigits: 2 })} STAKE`
                : 'Belum Terungkap 🔒'}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Penjual</span>
            <span className="text-[11px] font-mono text-gray-500 break-all block mt-1 bg-slate-50 p-2 rounded border border-gray-100">
              {auction.seller_address}
            </span>
          </div>
        </div>

        {/* Right: Actions & Timer */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Batas Waktu & Aksi</h3>
          
          <div className="space-y-2">
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Waktu Mulai</span>
              <p className="font-mono text-xs text-gray-700">
                {new Date(auction.start_time).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Waktu Berakhir</span>
              <p className="font-mono text-xs text-gray-700">
                {new Date(auction.end_time).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="pt-2">
            {auction.auction_status === 'active' ? (
              <button
                onClick={() => navigate(`/auctions/${itemId}/bid`)}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-secondary active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-base">fingerprint</span>
                Ajukan Penawaran Rahasia (ZKP)
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-200 p-2.5 rounded-lg leading-relaxed">
                  Lelang telah ditutup. Silakan lakukan Reveal Bid (membuka penawaran Anda), klaim jika menang, atau tarik jaminan kembali.
                </p>
                <button
                  onClick={() => navigate(`/auctions/${itemId}/reveal`)}
                  className="w-full bg-gray-800 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">lock_open</span>
                  Buka Penawaran (Reveal)
                </button>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleClaimWin}
                    disabled={actionLoading}
                    className="bg-primary text-white font-bold py-2.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-secondary active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                    Klaim Barang
                  </button>
                  <button
                    onClick={handleRefundCollateral}
                    disabled={actionLoading}
                    className="bg-gray-100 text-gray-700 font-bold py-2.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed border border-gray-200"
                  >
                    <span className="material-symbols-outlined text-sm">undo</span>
                    Tarik Refund
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      {auction.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">Deskripsi Aset</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{auction.description}</p>
        </div>
      )}

      {/* ZKP Proofs Backup Trail */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="border-b border-gray-100 pb-2 mb-3">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Jejak Audit ZKP Proofs ({proofs.length})</h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider leading-relaxed">
            Backup komitmen kriptografi yang terdaftar secara publik di jaringan.
          </p>
        </div>

        {proofs.length === 0 ? (
          <p className="text-gray-400 text-xs italic py-4">Belum ada penawaran kriptografi (proof commitment) yang masuk.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-500">
                  <th className="px-4 py-2 font-semibold">Alamat Bidder</th>
                  <th className="px-4 py-2 font-semibold">Commitment Hash</th>
                  <th className="px-4 py-2 font-semibold">Verifikasi</th>
                  <th className="px-4 py-2 font-semibold">Tanggal Kirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {proofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-primary font-bold">
                      {proof.bidder_address.substring(0, 14)}...{proof.bidder_address.substring(proof.bidder_address.length - 4)}
                    </td>
                    <td className="px-4 py-2.5 break-all select-all font-mono">
                      {proof.commitment_hash}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        proof.verified 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {proof.verified ? 'Sah ✓' : 'Terkunci 🔒'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-400">
                      {new Date(proof.proof_generated_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
=======
export default function AuctionDetail() {
  return (
    <div className="p-8 text-center bg-white rounded-xl shadow border border-gray-100 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🔍 Detail Lelang</h2>
      <p className="text-gray-500">Halaman ini sedang menunggu file kode baru dari Anda.</p>
    </div>
  )
}
>>>>>>> Stashed changes
