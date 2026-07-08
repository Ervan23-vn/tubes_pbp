import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Network Monitoring Page
 * Monitor status 4 node lelang-testnet lokal
 * Data akan muncul secara real-time saat node blockchain aktif
 */

const NODES = [
  { id: 1, name: 'Node 1 (PenyelenggaraLelang)', rpcUrl: 'http://localhost:26607', port: 26607 },
  { id: 2, name: 'Node 2 (AuditorIndependen)', rpcUrl: 'http://localhost:26617', port: 26617 },
  { id: 3, name: 'Node 3 (BankEscrow)', rpcUrl: 'http://localhost:26627', port: 26627 },
  { id: 4, name: 'Node 4 (RegulatorPengawas)', rpcUrl: 'http://localhost:26637', port: 26637 },
];

export default function NetworkMonitoring() {
  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    checkNodesStatus();
    const interval = setInterval(checkNodesStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkNodesStatus = async () => {
    setLoading(true);
    const statuses = await Promise.all(
      NODES.map(async (node) => {
        try {
          const start = Date.now();
          const response = await fetch(`${node.rpcUrl}/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          });

          if (response.ok) {
            const latency = Date.now() - start;
            const data = await response.json();
            return {
              ...node,
              status: 'online',
              latency: `${latency}ms`,
              blockHeight: data.result?.sync_info?.latest_block_height || '-',
              chainId: data.result?.node_info?.network || '-',
              peers: data.result?.net_info?.n_peers || 0
            };
          }
          return { ...node, status: 'offline', latency: '-', blockHeight: '-', chainId: '-', peers: 0 };
        } catch {
          return { ...node, status: 'offline', latency: '-', blockHeight: '-', chainId: '-', peers: 0 };
        }
      })
    );

    setNodeStatuses(statuses);
    setLastUpdated(new Date());
    setLoading(false);
  };

  const onlineCount = nodeStatuses.filter(n => n.status === 'online').length;
  const hasData = onlineCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Monitoring Jaringan</h1>
          <p className="text-gray-600 mt-1">Status real-time 4 node lelang-testnet lokal</p>
        </div>
        <button
          onClick={checkNodesStatus}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">Total Nodes</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{NODES.length}</p>
        </div>
        <div className={`${hasData ? 'bg-green-50' : 'bg-gray-50'} rounded-lg p-6 border`}>
          <p className="text-gray-600 text-sm">Online</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{onlineCount}</p>
        </div>
        <div className={`${!hasData ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-6 border`}>
          <p className="text-gray-600 text-sm">Offline</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{NODES.length - onlineCount}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border">
          <p className="text-gray-600 text-sm">Chain ID</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">lelang-testnet</p>
        </div>
      </div>

      {/* Nodes Status Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Status Node</h2>
        </div>

        {loading && nodeStatuses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memeriksa status node...</p>
          </div>
        ) : !hasData ? (
          <div className="p-12 text-center space-y-4">
            <WifiOff size={48} className="mx-auto text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Node Aktif</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Saat ini tidak ada node blockchain yang terdeteksi. Pastikan node lelang-testnet sudah berjalan
              di lokal sebelum data monitoring dapat ditampilkan.
            </p>
            <div className="bg-gray-50 border rounded-lg p-4 text-left max-w-lg mx-auto mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Cara menjalankan node:</p>
              <pre className="text-xs text-gray-600 font-mono">
{`cd chain
make localnet-build
# Jalankan masing-masing node di terminal terpisah`}
              </pre>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Node</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">RPC URL</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Block Height</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chain ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Peers</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Latency</th>
                </tr>
              </thead>
              <tbody>
                {nodeStatuses.map((node) => (
                  <tr key={node.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{node.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${
                        node.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {node.status === 'online' ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span>{node.status === 'online' ? 'Online' : 'Offline'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{node.rpcUrl}</td>
                    <td className="px-6 py-4 font-mono text-gray-800">{node.blockHeight}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{node.chainId}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">{node.peers}</td>
                    <td className="px-6 py-4 font-mono text-gray-800">{node.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-right">
          Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')} · Auto-refresh setiap 10 detik
        </div>
      )}
    </div>
  );
}
