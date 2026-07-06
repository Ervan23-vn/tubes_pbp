import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { auctionsAPI, zkpAPI, getImageUrl } from '../utils/api';

/**
 * Auction Detail Page
 * Lihat detail lelang dan tutup lelang
 */

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
          <p className="text-gray-600">Loading auction details...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{auction.title}</h1>
          <p className="text-gray-500 font-mono text-sm mt-2">{auction.item_id}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-800"
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

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Image */}
        <div className="col-span-1">
          {auction.image_url && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <img
                src={getImageUrl(auction.image_url)}
                alt={auction.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </div>

        {/* Middle Column - Details */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                auction.auction_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {auction.auction_status === 'active' ? '🟢 Aktif' : '⏹️ Selesai'}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-600">Kategori</p>
              <p className="font-semibold text-gray-800 mt-1">{auction.category}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Harga Mulai</p>
              <p className="font-mono font-semibold text-lg text-gray-800 mt-1">
                {parseFloat(auction.starting_price).toLocaleString('id-ID')} STAKE
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Harga Tertinggi Saat Ini</p>
              <p className="font-mono font-semibold text-lg text-gray-800 mt-1">
                {auction.current_highest_bid 
                  ? parseFloat(auction.current_highest_bid).toLocaleString('id-ID') 
                  : '-'} STAKE
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
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

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Statistik</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bid</span>
                <span className="font-semibold">{auction.total_bids_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peserta</span>
                <span className="font-semibold">
                  {auction.highest_bidder_address ? '1+' : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {auction.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Deskripsi</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{auction.description}</p>
        </div>
      )}

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
