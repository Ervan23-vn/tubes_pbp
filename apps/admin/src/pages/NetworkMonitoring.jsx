import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Network Monitoring Page
 * Monitor status 4 node lelang-testnet lokal
 */

const NODES = [
  { id: 1, name: 'Node 1', rpcUrl: 'http://localhost:26657', port: 26657 },
  { id: 2, name: 'Node 2', rpcUrl: 'http://localhost:26668', port: 26668 },
  { id: 3, name: 'Node 3', rpcUrl: 'http://localhost:26679', port: 26679 },
  { id: 4, name: 'Node 4', rpcUrl: 'http://localhost:26690', port: 26690 },
];

export default function NetworkMonitoring() {
  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkNodesStatus();
    // Auto-refresh every 10 seconds
    const interval = setInterval(checkNodesStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkNodesStatus = async () => {
    const statuses = await Promise.all(
      NODES.map(async (node) => {
        try {
          const response = await fetch(`${node.rpcUrl}/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              ...node,
              status: 'online',
              latency: '< 100ms',
              blockHeight: data.result?.sync_info?.latest_block_height || 'N/A',
              chainId: data.result?.node_info?.network || 'N/A',
              peers: data.result?.net_info?.n_peers || 0
            };
          } else {
            return {
              ...node,
              status: 'offline',
              latency: 'N/A',
              blockHeight: 'N/A',
              chainId: 'N/A',
              peers: 0
            };
          }
        } catch (error) {
          return {
            ...node,
            status: 'offline',
            latency: 'N/A',
            blockHeight: 'N/A',
            chainId: 'N/A',
            peers: 0,
            error: error.message
          };
        }
      })
    );
    
    setNodeStatuses(statuses);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Monitoring Jaringan</h1>
        <p className="text-gray-600 mt-1">Status real-time 4 node lelang-testnet lokal</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Info:</strong> Halaman ini menampilkan status 4 node blockchain lelang-testnet.
          Data diperbarui secara otomatis setiap 10 detik dari RPC endpoints lokal.
        </p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Nodes"
          value={nodeStatuses.length}
          subtext={`${nodeStatuses.filter(n => n.status === 'online').length} Online`}
          icon="🖥️"
        />
        <StatCard
          label="Chain ID"
          value="lelang-testnet"
          subtext="Local testnet"
          icon="🔗"
        />
        <StatCard
          label="Network Status"
          value={nodeStatuses.every(n => n.status === 'online') ? 'Healthy' : 'Issues'}
          subtext={nodeStatuses.every(n => n.status === 'online') ? '✓ All nodes OK' : '⚠ Check nodes'}
          icon="💚"
          color={nodeStatuses.every(n => n.status === 'online') ? 'bg-green-50' : 'bg-yellow-50'}
        />
        <StatCard
          label="Avg Block Height"
          value={Math.round(
            nodeStatuses.reduce((sum, n) => {
              const height = typeof n.blockHeight === 'number' ? n.blockHeight : 0;
              return sum + height;
            }, 0) / nodeStatuses.filter(n => n.blockHeight !== 'N/A').length || 0
          )}
          subtext="Latest block"
          icon="📦"
        />
      </div>

      {/* Nodes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Status Node</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Loading node status...</p>
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
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{node.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        node.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {node.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {node.rpcUrl}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-800">
                      {node.blockHeight}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {node.chainId}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">
                      {node.peers}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-800">
                      {node.latency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Node Details */}
      <div className="grid grid-cols-2 gap-6">
        {nodeStatuses.map((node) => (
          <div key={node.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{node.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                node.status === 'online'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {node.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">RPC Port:</span>
                <span className="font-mono font-semibold">{node.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block Height:</span>
                <span className="font-mono font-semibold">{node.blockHeight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connected Peers:</span>
                <span className="font-mono font-semibold">{node.peers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Latency:</span>
                <span className="font-mono font-semibold">{node.latency}</span>
              </div>
            </div>

            {node.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <p className="font-semibold">Error:</p>
                <p className="font-mono">{node.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Setup Lokal 4 Node</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>Untuk menjalankan 4 node lelang-testnet lokal:</p>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`# Terminal 1
cd chain
make localnet-build

# Terminal 2 (Node 1 - RPC 26657)
chmod +x localnet/node*/config/*.sh
cd localnet/node
./node start

# Terminal 3 (Node 2 - RPC 26668)
cd localnet/node1
./node start

# Terminal 4 (Node 3 - RPC 26679)
cd localnet/node2
./node start

# Terminal 5 (Node 4 - RPC 26690)
cd localnet/node3
./node start`}
          </pre>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-right">
        Last updated: {new Date().toLocaleTimeString('id-ID')}
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon, color = 'bg-blue-50' }) {
  return (
    <div className={`${color} rounded-lg p-6 border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
