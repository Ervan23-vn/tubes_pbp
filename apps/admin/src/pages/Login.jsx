import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { connectKeplrWallet, authenticateWithBackend } from '../utils/keplr';

/**
 * Login Page
 * Keplr Wallet Connection & Authentication
 */

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleKeplrLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Connect to Keplr
      console.log('Connecting to Keplr wallet...');
      const connectResult = await connectKeplrWallet();
      
      if (!connectResult.success) {
        throw new Error(connectResult.error || 'Failed to connect Keplr wallet');
      }

      const walletAddress = connectResult.address;
      console.log('✓ Connected to wallet:', walletAddress);

      // Step 2: Authenticate with backend
      console.log('Authenticating with backend...');
      const authResult = await authenticateWithBackend(walletAddress);
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Backend authentication failed');
      }

      console.log('✓ Authenticated successfully');
      console.log('JWT Token received:', authResult.token.substring(0, 20) + '...');

      // Step 3: Redirect to dashboard
      onSuccess();
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = () => {
    localStorage.setItem('authToken', 'mock_dev_auth_token_bypass');
    localStorage.setItem('walletAddress', 'cosmos1test1234567890abcdefghijklmnop1');
    onSuccess();
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Lelang Blockchain
          </h1>
          <p className="text-gray-600">Admin Seller Center</p>
          <p className="text-sm text-gray-500 mt-2">TAHAP G - Frontend Admin</p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Masuk dengan Keplr Wallet:</strong><br/>
            Pastikan Keplr wallet sudah terinstall dan terhubung ke chain lelang-testnet.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleKeplrLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition mb-2"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Menghubungkan...</span>
            </span>
          ) : (
            '🦊 Login dengan Keplr Wallet'
          )}
        </button>

        {/* Developer Bypass Button */}
        <button
          onClick={handleBypassLogin}
          className="w-full py-2 px-4 border border-dashed border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-800 transition mb-4"
        >
          ⚙️ Bypass Login (Developer Mode)
        </button>

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Instruksi:</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Pastikan Keplr wallet sudah terinstall di browser</li>
            <li>Pastikan chain "lelang-testnet" sudah ditambahkan di Keplr</li>
            <li>Klik tombol "Login dengan Keplr Wallet"</li>
            <li>Klik "Approve" di popup Keplr</li>
            <li>Tanda tangan message yang muncul</li>
            <li>Anda akan diarahkan ke Dashboard</li>
          </ol>
        </div>

        {/* Backend Status */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Backend API: <span className="font-mono">http://localhost:3001/api</span>
          </p>
        </div>
      </div>
    </div>
  );
}
