import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { connectKeplrWallet, authenticateWithBackend } from '../utils/keplr'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [formData, setFormData] = useState({
    nim: '',
    password: '',
    keepActive: false
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [toast, setToast] = useState(null)
  const glowRef = useRef(null)

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Glow accent micro-interaction tracking mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`
        glowRef.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return
    setIsAnimating(true)
    setMode(newMode)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 100)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setLoadingMessage('Memverifikasi identitas node (Keplr)...')

    try {
      // 1. Hubungkan dompet Keplr
      const wallet = await connectKeplrWallet()
      setLoadingMessage(`Menghubungkan ke ${wallet.name || 'Dompet Keplr'}...`)
      
      // 2. Verifikasi tanda tangan dengan Backend
      await authenticateWithBackend(wallet.address)
      
      showToast(mode === 'login' ? 'Sesi Protokol Dimulai!' : 'Identitas Node Berhasil Didaftarkan!', 'success')
      
      setTimeout(() => {
        setIsLoading(false)
        navigate('/marketplace')
      }, 1000)

    } catch (err) {
      console.warn('Backend/Keplr error:', err.message)
      showToast('Gagal terhubung ke backend. Menggunakan mode Bypass Developer...', 'error')
      
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
    <div className="bg-background text-on-background min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 selection:bg-primary/30 relative overflow-hidden">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-mono text-xs text-primary tracking-widest uppercase animate-pulse">{loadingMessage}</p>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 border rounded-lg shadow-2xl transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-green-950/80 border-green-500/40 text-green-200' 
            : 'bg-indigo-950/80 border-primary/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {toast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="font-body-md text-xs">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          ref={glowRef}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] glow-accent blur-[120px]"
          style={{ left: '50%', top: '50%', transition: 'left 0.1s ease-out, top 0.1s ease-out' }}
        ></div>
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', 
            backgroundSize: '32px 32px' 
          }}
        ></div>
        <div className="scanline"></div>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-[440px] z-10 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Brand Identity */}
        <div className="text-center space-y-2">
          <h1 className="font-headline-lg-mobile text-3xl md:text-4xl font-bold tracking-tighter text-primary">
            AETHER AUCTION
          </h1>
          <p className="font-label-mono text-xs text-on-surface-variant tracking-widest uppercase opacity-60">
            Akses Node Konsorsium
          </p>
        </div>

        {/* Auth Card */}
        <div 
          className={`glass-panel p-6 sm:p-8 md:p-10 relative overflow-hidden group transition-all duration-500 hover:border-primary/30 bg-[#0a0d14]/75 border border-white/5 ${
            isAnimating ? 'scale-[0.99]' : 'scale-100'
          }`}
          style={{ transition: 'transform 0.1s ease, border-color 0.5s ease' }}
        >
          {/* Decorative corner highlights */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/40"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/40"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/40"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/40"></div>

          <div className="space-y-6 md:space-y-8">
            
            {/* Mode Toggle */}
            <div className="flex border border-white/10 p-1 bg-black/20">
              <button 
                type="button"
                className={`flex-1 py-2 font-label-mono text-xs transition-all duration-300 ${
                  mode === 'login' 
                    ? 'bg-white/5 text-primary font-bold' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
                onClick={() => handleModeSwitch('login')}
              >
                MASUK
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 font-label-mono text-xs transition-all duration-300 ${
                  mode === 'register' 
                    ? 'bg-white/5 text-primary font-bold' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
                onClick={() => handleModeSwitch('register')}
              >
                DAFTAR
              </button>
            </div>

            {/* Header Content */}
            <div className="space-y-1">
              <h2 className="font-stats-display text-lg text-white font-bold">
                {mode === 'login' ? 'Mulai Sesi' : 'Registrasi Node'}
              </h2>
              <p className="font-caption text-xs text-on-surface-variant">
                {mode === 'login' 
                  ? 'Koneksikan Keplr Wallet Anda untuk otentikasi aman.' 
                  : 'Daftarkan identitas baru pada jaringan Aether.'}
              </p>
            </div>

            {/* Form Fields */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* NIM Input */}
                <div className="space-y-2 group">
                  <label 
                    className="block font-label-mono text-xs text-on-surface-variant group-focus-within:text-primary transition-colors" 
                    htmlFor="nim"
                  >
                    ID ANGGOTA (NIM)
                  </label>
                  <div className="relative">
                    <input 
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30 font-mono" 
                      id="nim" 
                      name="nim" 
                      type="text"
                      placeholder="NODE-XXXX-XXXX" 
                      required 
                      value={formData.nim}
                      onChange={handleInputChange}
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary/60 transition-colors select-none">
                      fingerprint
                    </span>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2 group">
                  <label 
                    className="block font-label-mono text-xs text-on-surface-variant group-focus-within:text-primary transition-colors" 
                    htmlFor="password"
                  >
                    KUNCI ENKRIPSI (PASSWORD)
                  </label>
                  <div className="relative">
                    <input 
                      className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/30" 
                      id="password" 
                      name="password" 
                      type="password"
                      placeholder="••••••••" 
                      required 
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary/60 transition-colors select-none">
                      lock
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Options */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    className="w-4 h-4 rounded-none bg-black/40 border-white/20 text-primary focus:ring-primary focus:ring-offset-0 transition-colors" 
                    type="checkbox"
                    name="keepActive"
                    checked={formData.keepActive}
                    onChange={handleInputChange}
                  />
                  <span className="text-xs text-on-surface-variant group-hover:text-white transition-colors">
                    Biarkan Sesi Tetap Aktif
                  </span>
                </label>
                <a 
                  className="text-xs text-primary hover:text-secondary transition-colors underline underline-offset-4 decoration-primary/30" 
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Pemulihan
                </a>
              </div>

              {/* Submit Button */}
              <button 
                className="w-full py-4 bg-primary text-white font-label-mono text-sm font-bold tracking-widest hover:bg-secondary transition-all duration-300 active:scale-[0.98] primary-glow cursor-pointer" 
                type="submit"
              >
                {mode === 'login' ? 'MASUK KE PROTOKOL' : 'DAFTAR IDENTITAS'}
              </button>
            </form>

            {/* Direct Bypass Link for testing */}
            <div className="text-center">
              <button 
                onClick={handleDirectBypass}
                className="text-xs text-on-surface-variant/65 hover:text-primary transition-colors font-mono cursor-pointer"
              >
                ⚡ Bypass Login (Developer Mode)
              </button>
            </div>

            {/* Status Footer */}
            <div className="flex justify-center items-center gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-mono text-[10px] text-secondary tracking-tighter">
                  JARINGAN AMAN
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-white/20"></div>
              <div className="font-label-mono text-[10px] text-on-surface-variant/40 tracking-tighter">
                LATENSI: 14MS
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
          <a className="font-label-mono text-[11px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors uppercase tracking-widest" href="#" onClick={(e) => e.preventDefault()}>
            Kebijakan Privasi
          </a>
          <a className="font-label-mono text-[11px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors uppercase tracking-widest" href="#" onClick={(e) => e.preventDefault()}>
            Log Audit
          </a>
          <a className="font-label-mono text-[11px] text-on-surface-variant/40 hover:text-on-surface-variant transition-colors uppercase tracking-widest" href="#" onClick={(e) => e.preventDefault()}>
            Dukungan
          </a>
        </div>
      </div>
    </div>
  )
}
