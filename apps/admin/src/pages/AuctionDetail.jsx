import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { auctionsAPI, zkpAPI, getImageUrl } from '../utils/api';

/**
 * Auction Detail Page (Admin / Seller Center)
 * Detail lelang barang IT, spesifikasi teknis, brand, garansi, kondisi, dan ZKP audit.
 */

const CONDITION_MAP = {
  'new': { label: 'Baru / Sealed', color: 'text-emerald-700 bg-emerald-50 border-emerald-255' },
  'like_new': { label: 'Bekas - Like New', color: 'text-blue-700 bg-blue-50 border-blue-255' },
  'good': { label: 'Bekas - Baik', color: 'text-yellow-700 bg-yellow-50 border-yellow-255' },
  'refurbished': { label: 'Refurbished', color: 'text-orange-700 bg-orange-50 border-orange-255' },
};

export default function AuctionDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAuctionDetail();
  }, [itemId]);

  const fetchAuctionDetail = async () => {
    try {
      setLoading(true);
      const [auctionRes, proofsRes] = await Promise.all([
        auctionsAPI.getById(itemId),
        zkpAPI.getProofsForAuction(itemId)
      ]);

      setAuction(auctionRes.data);
      setProofs(proofsRes.data || []);
    } catch (err) {
      console.error('Fetch auction detail error:', err);
      setError(err.message || 'Gagal memuat detail lelang');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAuction = async () => {
    if (!confirm('Yakin ingin menutup lelang ini? Tidak bisa dibatalkan.')) {
      return;
    }

    try {
      setError('');
      const result = await auctionsAPI.updateStatus(itemId, 'ended');
      if (result.success) {
        setSuccess('Lelang berhasil ditutup!');
        setTimeout(() => {
          setAuction(result.data);
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Gagal menutup lelang');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-650">Loading auction details...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-semibold">Lelang tidak ditemukan</p>
      </div>
    );
  }

  // Parse specifications JSON
  let specs = {};
  try {
    specs = auction.specifications ? (typeof auction.specifications === 'string' ? JSON.parse(auction.specifications) : auction.specifications) : {};
  } catch (e) {
    console.error('Error parsing specs:', e);
  }

  const condInfo = CONDITION_MAP[auction.item_condition] || { label: auction.item_condition || 'New', color: 'text-gray-700 bg-gray-50' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Seller Center / Detail Lelang IT</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-1">{auction.title}</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">{auction.item_id}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-800 border px-3 py-1.5 rounded-lg text-sm bg-white"
        >
          ← Kembali
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">✓ {success}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Image */}
        <div className="col-span-1">
          {auction.image_url && (
            <div className="bg-white rounded-lg shadow overflow-hidden relative">
              <img
                src={getImageUrl(auction.image_url)}
                alt={auction.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-xs font-semibold text-gray-650 border uppercase">
                {auction.main_category === 'software' ? '💿 Software' : '🔧 Hardware'}
              </div>
              <div className={`absolute top-2 right-2 border px-2 py-0.5 rounded text-xs font-bold ${condInfo.color}`}>
                {condInfo.label}
              </div>
            </div>
          )}
        </div>

        {/* Middle Column - Details */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                auction.auction_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {auction.auction_status === 'active' ? '🟢 Aktif' : '⏹️ Selesai'}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Sub-Kategori</p>
              <p className="font-semibold text-gray-800 mt-1 uppercase text-sm">{auction.sub_category}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Harga Mulai</p>
              <p className="font-mono font-semibold text-lg text-gray-800 mt-1">
                {parseFloat(auction.starting_price).toLocaleString('id-ID')} LCT
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Harga Tertinggi Saat Ini</p>
              <p className="font-mono font-semibold text-lg text-gray-800 mt-1">
                {auction.current_highest_bid 
                  ? `${parseFloat(auction.current_highest_bid).toLocaleString('id-ID')} LCT` 
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Time */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Waktu Lelang</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Mulai</p>
                <p className="font-mono text-sm text-gray-800">
                  {new Date(auction.start_time).toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Berakhir</p>
                <p className="font-mono text-sm text-gray-800">
                  {new Date(auction.end_time).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {auction.auction_status === 'active' && (
              <button
                onClick={handleCloseAuction}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                🔒 Tutup Lelang
              </button>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Brand & Technical Specifications */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-1">
            <span>📊</span> Spesifikasi Teknis
          </h3>
          {Object.keys(specs).length === 0 ? (
            <p className="text-gray-400 text-sm italic">Spesifikasi detail tidak dicantumkan.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <tbody>
                  {Object.entries(specs).map(([key, val], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-4 py-2 font-semibold text-gray-500 border-r w-1/3">{key}</td>
                      <td className="px-4 py-2 text-gray-800 font-medium">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-1">
            <span>ℹ️</span> Detail Tambahan
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 block">Brand / Merek</span>
              <span className="font-bold text-gray-800 mt-1 block">{auction.brand || 'Tidak ada brand'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Garansi</span>
              <span className="font-bold text-gray-800 mt-1 block">{auction.warranty_info || 'Tidak ada garansi'}</span>
            </div>
          </div>
          <div className="border-t pt-3">
            <span className="text-gray-400 block text-sm">Deskripsi</span>
            <p className="text-gray-700 whitespace-pre-wrap text-sm mt-1">{auction.description || 'Tidak ada deskripsi.'}</p>
          </div>
        </div>
      </div>

      {/* ZKP Proofs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">ZKP Proofs ({proofs.length})</h3>
        <p className="text-sm text-gray-600 mb-4">
          Backup dari Zero-Knowledge Proof commitments yang dikirim peserta.
          (Tidak menyimpan nominal bid, hanya commitment hash dan proof structure)
        </p>

        {proofs.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada bid masuk</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Bidder</th>
                  <th className="px-4 py-2 text-left">Commitment Hash</th>
                  <th className="px-4 py-2 text-left">Verified</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {proofs.map((proof) => (
                  <tr key={proof.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">
                      {proof.bidder_address.substring(0, 16)}...
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {proof.commitment_hash.substring(0, 20)}...
                    </td>
                    <td className="px-4 py-2">
                      {proof.verified ? '✓' : '-'}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {new Date(proof.proof_generated_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
