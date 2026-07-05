import { useState, useEffect } from 'react';
import { Shield, Activity, Server } from 'lucide-react';

/**
 * Security Report Page
 * Menampilkan laporan keamanan sistem secara real-time
 * Data akan terisi otomatis saat backend API dan node blockchain aktif
 */

export default function SecurityReport() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const data = await response.json();
        setBackendStatus(data);
      } else {
        setBackendStatus(null);
      }
    } catch {
      setBackendStatus(null);
    }
    setLoading(false);
  };

  const isBackendOnline = backendStatus !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Laporan Keamanan</h1>
        <p className="text-gray-600 mt-1">Status keamanan sistem lelang blockchain</p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${isBackendOnline ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-6 border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Backend API</p>
              <p className={`text-lg font-bold mt-1 ${isBackendOnline ? 'text-green-700' : 'text-red-700'}`}>
                {loading ? 'Memeriksa...' : isBackendOnline ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
            <Server size={28} className={isBackendOnline ? 'text-green-600' : 'text-red-400'} />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Autentikasi</p>
              <p className="text-lg font-bold text-gray-800 mt-1">Keplr + JWT</p>
            </div>
            <Shield size={28} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Privasi Bid</p>
              <p className="text-lg font-bold text-gray-800 mt-1">ZKP Protected</p>
            </div>
            <Activity size={28} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status keamanan sistem...</p>
        </div>
      ) : !isBackendOnline ? (
        <div className="bg-white rounded-lg shadow p-12 text-center space-y-4">
          <Shield size={48} className="mx-auto text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-700">Backend Belum Aktif</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Laporan keamanan lengkap akan ditampilkan saat backend API server sudah berjalan.
            Jalankan backend terlebih dahulu untuk melihat data real-time.
          </p>
          <div className="bg-gray-50 border rounded-lg p-4 text-left max-w-lg mx-auto mt-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Cara menjalankan backend:</p>
            <pre className="text-xs text-gray-600 font-mono">
{`cd apps/backend
npm install
npm run dev`}
            </pre>
          </div>
          <button
            onClick={checkBackendHealth}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
          >
            Cek Ulang
          </button>
        </div>
      ) : (
        <>
          {/* Security Architecture Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔒 Arsitektur Keamanan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Perlindungan Data</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Bid amount tidak disimpan di database (hanya commitment hash)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>ZKP proof menjamin privasi penawaran</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Wallet-based authentication (tanpa password)</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700">Keamanan API</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>JWT Token untuk setiap request</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Prepared statements (SQL Injection prevention)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>CORS restriction pada localhost</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Info:</strong> Halaman ini menampilkan status keamanan secara real-time berdasarkan
              koneksi ke backend API. Laporan detail akan bertambah seiring dengan perkembangan fitur sistem.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
