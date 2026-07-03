import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Plus } from 'lucide-react';
import { auctionsAPI, usersAPI } from '../utils/api';

/**
 * Dashboard Page
 * Display seller's auctions and statistics
 */

export default function Dashboard() {
  const [auctions, setAuctions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch auctions and stats in parallel
      const [auctionsRes, statsRes] = await Promise.all([
        auctionsAPI.getSellerAuctions(),
        usersAPI.getStats()
      ]);

      setAuctions(auctionsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const activeAuctions = auctions.filter(a => a.auction_status === 'active').length;
  const endedAuctions = auctions.filter(a => a.auction_status === 'ended').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/auctions/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 transition"
        >
          <Plus size={20} />
          <span>Buat Lelang Baru</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Lelang"
              value={stats?.seller_stats?.total_auctions || 0}
              icon="📊"
              color="bg-blue-50"
            />
            <StatCard
              title="Lelang Aktif"
              value={activeAuctions}
              icon="✨"
              color="bg-green-50"
            />
            <StatCard
              title="Lelang Selesai"
              value={endedAuctions}
              icon="✅"
              color="bg-purple-50"
            />
            <StatCard
              title="Total Bid"
              value={stats?.bidder_stats?.total_bids || 0}
              icon="🎯"
              color="bg-orange-50"
            />
          </div>

          {/* Auctions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Lelang Anda</h2>
            </div>

            {auctions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">Anda belum membuat lelang</p>
                <Link
                  to="/auctions/create"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Buat Lelang Pertama Anda
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Judul</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Harga Mulai</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bid Tertinggi</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total Bid</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auctions.map((auction) => (
                      <tr key={auction.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-800">{auction.title}</p>
                            <p className="text-xs text-gray-500 font-mono">{auction.item_id.substring(0, 16)}...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            auction.auction_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {auction.auction_status === 'active' ? '🟢 Aktif' : '⏹️ Selesai'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-800">
                          {parseFloat(auction.starting_price).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-800">
                          {auction.current_highest_bid ? parseFloat(auction.current_highest_bid).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-800">
                          {auction.total_bids_count}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/auctions/${auction.item_id}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} rounded-lg p-6 border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
