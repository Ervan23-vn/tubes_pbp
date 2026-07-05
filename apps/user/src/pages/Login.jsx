import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react'
import { connectKeplrWallet, authenticateWithBackend } from '../utils/keplr'

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Clear toast setelah 3 detik
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const handleConnectWallet = async () => {
    setIsLoading(true)
    setError('')
    setLoadingMessage('Mendeteksi Keplr Wallet...')

    try {
      // 1. Hubungkan dompet Keplr
      const wallet = await connectKeplrWallet()
      setLoadingMessage(`Menghubungkan ke ${wallet.name || 'Dompet Keplr'}...`)
      
      // 2. Verifikasi tanda tangan dengan Backend
      await authenticateWithBackend(wallet.address)
      
      showToast('Sesi Protokol Dimulai!', 'success')
      
      setTimeout(() => {
        setIsLoading(false)
        navigate('/marketplace')
      }, 1000)

    } catch (err) {
      console.warn('Backend/Keplr error:', err.message)
      setError(err.message || 'Gagal terhubung ke backend')
      showToast('Gagal terhubung ke backend. Menggunakan mode Bypass...', 'error')
      
      // Fallback ke Developer Bypass Mode demi kemudahan pengujian UI
      setTimeout(() => {
        localStorage.setItem('jwt_token', 'mock_jwt_token_bypass')
        localStorage.setItem('wallet_address', 'cosmos1test1234567890abcdefghijklmnop1')
        setIsLoading(false)
        navigate('/marketplace')
      }, 1500)
    }
  }

  // Direct Dev Bypass
  const handleDirectBypass = () => {
    localStorage.setItem('jwt_token', 'mock_jwt_token_bypass')
    localStorage.setItem('wallet_address', 'cosmos1test1234567890abcdefghijklmnop1')
    showToast('Developer Bypass Mode diaktifkan!', 'success')
    navigate('/marketplace')
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full flex flex-col items-center justify-center py-10 px-4">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs text-white tracking-widest uppercase animate-pulse">{loadingMessage}</p>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 border rounded-xl shadow-2xl transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' 
              ? <ShieldCheck size={16} className="text-emerald-600" />
              : <AlertCircle size={16} className="text-blue-600" />
            }
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Lelang Blockchain
          </h1>
          <p className="text-gray-600">Buyer Marketplace</p>
          <p className="text-sm text-gray-500">TAHAP G - Frontend Pembeli</p>
        </div>

        {/* Card Panel */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8">
          
          <div className="space-y-6">
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <ShieldCheck className="text-blue-600 mt-0.5 shrink-0" size={18} />
              <p className="text-sm text-blue-800 leading-relaxed">
                <strong>Masuk dengan Keplr Wallet:</strong><br />
                Pastikan Keplr wallet sudah terinstall dan terhubung ke chain <span className="font-mono font-bold">lelang-testnet</span>.
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={18} />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menghubungkan...</span>
                </span>
              ) : (
                <>
                  <Wallet size={18} />
                  <span>🦊 Login dengan Keplr Wallet</span>
                </>
              )}
            </button>

            {/* Dev Bypass Button */}
            <button
              onClick={handleDirectBypass}
              className="w-full py-2 px-4 border border-dashed border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-800 transition cursor-pointer"
            >
              ⚙️ Bypass Login (Developer Mode)
            </button>

            {/* Instructions */}
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-gray-400" />
                Instruksi:
              </h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Pastikan Keplr wallet sudah terinstall di browser</li>
                <li>Pastikan chain "lelang-testnet" sudah ditambahkan di Keplr</li>
                <li>Klik tombol "Login dengan Keplr Wallet"</li>
                <li>Klik "Approve" di popup Keplr</li>
                <li>Tanda tangan message yang muncul</li>
                <li>Anda akan diarahkan ke Marketplace</li>
              </ol>
            </div>

          </div>
        </div>

        {/* Backend Status Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Backend API: <span className="font-mono">http://localhost:3001/api</span>
          </p>
        </div>
      </div>
    </div>
  )
}
