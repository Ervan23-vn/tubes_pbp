import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers as ethersObj } from 'ethers'
import { getStoredWalletAddress } from '../utils/keplr'

export default function RevealBid() {
  const navigate = useNavigate()
  const walletAddress = getStoredWalletAddress()

  const [bidsSubmitted, setBidsSubmitted] = useState([])
  const [selectedBid, setSelectedBid] = useState(null)
  const [revealStatus, setRevealStatus] = useState(null) // null | 'success'
  const [inputMode, setInputMode] = useState('upload') // 'upload' | 'manual'
  const [toast, setToast] = useState(null)

  // Input states
  const [manualAmount, setManualAmount] = useState('')
  const [manualSalt, setManualSalt] = useState('')
  const [localComputedHash, setLocalComputedHash] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)

  // Load bids from localStorage
  useEffect(() => {
    const existing = localStorage.getItem('bid_history')
    if (existing) {
      try {
        setBidsSubmitted(JSON.parse(existing))
      } catch (e) { /* ignore */ }
    }
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // Filter bids
  const unrevealedBids = bidsSubmitted.filter((bid) => !bid.revealed)
  const revealedBids = bidsSubmitted.filter((bid) => bid.revealed)

  const truncHash = (hash) => {
    if (!hash) return ''
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`
  }

  // Calculate hash locally based on inputs
  useEffect(() => {
    if (!manualAmount || isNaN(parseFloat(manualAmount)) || parseFloat(manualAmount) <= 0 || !manualSalt) {
      setLocalComputedHash('')
      return
    }
    try {
      const amountInWei = ethersObj.parseEther(manualAmount)
      const hash = ethersObj.solidityPackedKeccak256(
        ['uint256', 'string'],
        [amountInWei, manualSalt]
      )
      setLocalComputedHash(hash)
    } catch (err) {
      console.error(err)
      setLocalComputedHash('')
    }
  }, [manualAmount, manualSalt])

  // Reset inputs when selected bid changes
  useEffect(() => {
    setManualAmount('')
    setManualSalt('')
    setRevealStatus(null)
  }, [selectedBid])

  // Parse key file — supports both ATOM and ETH labels
  const parseAndApplyKeyFile = (text) => {
    try {
      const bidMatch = text.match(/NOMINAL PENAWARAN:\s*([\d.]+)\s*(ATOM|ETH)/i)
      const saltMatch = text.match(/SECRET SALT\s*:\s*(\S+)/i)

      if (bidMatch && saltMatch) {
        setManualAmount(bidMatch[1])
        setManualSalt(saltMatch[1])
        showToast('Kunci rahasia berhasil dimuat dari berkas!', 'success')
      } else {
        showToast('Format berkas kunci tidak valid atau rusak.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Gagal memproses berkas kunci.', 'error')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      parseAndApplyKeyFile(event.target.result)
    }
    reader.readAsText(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        parseAndApplyKeyFile(event.target.result)
      }
      reader.readAsText(file)
    }
  }

  const handleReveal = async () => {
    if (!selectedBid || !localComputedHash) return

    if (localComputedHash.toLowerCase() !== selectedBid.hash.toLowerCase()) {
      showToast('Kombinasi Nominal & Salt TIDAK cocok dengan hash komitmen.', 'error')
      return
    }

    try {
      // Mark bid as revealed in localStorage
      const updated = bidsSubmitted.map((b) => {
        if (b.hash === selectedBid.hash) {
          return { ...b, revealed: true, revealedAmount: parseFloat(manualAmount) }
        }
        return b
      })
      setBidsSubmitted(updated)
      localStorage.setItem('bid_history', JSON.stringify(updated))

      setRevealStatus('success')
      showToast('Sukses mengungkap penawaran! Data hash terverifikasi penuh.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Gagal menyinkronkan data reveal.', 'error')
    }
  }

  const handleReset = () => {
    setSelectedBid(null)
    setRevealStatus(null)
    setManualAmount('')
    setManualSalt('')
  }

  const hashesMatch = selectedBid && localComputedHash && selectedBid.hash.toLowerCase() === localComputedHash.toLowerCase()

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-[720px] mx-auto w-full">

      {/* Floating Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 border rounded-lg shadow-2xl transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-300 text-green-700'
            : toast.type === 'error'
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-blue-50 border-blue-300 text-blue-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6 text-center">
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Decryption & Proof Verification Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            Reveal Portal (Pembukaan)
          </h1>
          <p className="text-gray-500 text-xs mt-2 max-w-[500px]">
            Dekripsi bukti komitmen Anda secara lokal di peramban dan verifikasi keasliannya ke sistem blockchain Aether.
          </p>
        </div>
      </div>

      {/* No bids at all */}
      {bidsSubmitted.length === 0 && (
        <div className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center justify-center text-center py-16 gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-4xl select-none">lock</span>
          </div>
          <div className="space-y-1 max-w-[380px]">
            <h3 className="text-base text-gray-800 font-bold">Belum Ada Komitmen</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Anda belum mengirimkan penawaran komitmen apa pun. Ajukan penawaran di halaman Marketplace terlebih dahulu, lalu kembali ke sini untuk membuka (reveal) penawaran Anda.
            </p>
          </div>
          <button
            onClick={() => navigate('/marketplace')}
            className="mt-2 bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
          >
            Buka Marketplace
          </button>
        </div>
      )}

      {/* Unrevealed Bids Section */}
      {unrevealedBids.length > 0 && (
        <div className="bg-white border border-yellow-200 p-6 md:p-8 rounded-xl flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="material-symbols-outlined text-[#fbbf24] text-2xl select-none">lock</span>
            <div>
              <h3 className="text-base text-gray-800 font-bold">Penawaran Terkunci (Perlu Reveal)</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{unrevealedBids.length} penawaran menunggu pembukaan</p>
            </div>
          </div>

          <div className="space-y-3">
            {unrevealedBids.map((bid) => {
              const isSelected = selectedBid?.hash === bid.hash
              return (
                <div
                  key={bid.hash}
                  onClick={() => {
                    if (revealStatus === null) {
                      setSelectedBid(bid)
                    }
                  }}
                  className={`p-4 rounded-lg border transition-all ${
                    revealStatus !== null && !isSelected ? 'opacity-50 pointer-events-none' : ''
                  } ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md cursor-default'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-800 font-bold truncate">{bid.assetName}</p>
                        <p className="text-[10px] text-primary/80 mt-0.5 truncate font-mono">
                          Komit Hash: {truncHash(bid.hash)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#fbbf24] font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        Terkomit
                      </p>
                      <p className="text-[10px] text-gray-400">{bid.timestamp}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected bid reveal form */}
          {selectedBid && revealStatus === null && (
            <div className="space-y-5 pt-4 border-t border-gray-100 animate-in fade-in duration-300">

              {/* Input Mode Selector */}
              <div className="flex border border-gray-200 p-1 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex-grow py-2 text-[11px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded ${
                    inputMode === 'upload'
                      ? 'bg-white text-primary font-bold shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">upload_file</span>
                  UNGGAH FILE KUNCI (.TXT)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`flex-grow py-2 text-[11px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer rounded ${
                    inputMode === 'manual'
                      ? 'bg-white text-primary font-bold shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">edit_note</span>
                  KETIK MANUAL DATA KUNCI
                </button>
              </div>

              {/* Upload Zone */}
              {inputMode === 'upload' && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-4xl text-gray-300">cloud_upload</span>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-800 font-bold">Seret & lepas berkas kunci di sini</p>
                    <p className="text-[10px] text-gray-400">atau cari berkas di folder lokal</p>
                  </div>
                  <label className="mt-2 bg-primary hover:bg-secondary text-white px-4 py-2 text-xs rounded-lg cursor-pointer transition-colors font-bold">
                    Pilih Berkas Kunci (.txt)
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Manual Input Fields */}
              {inputMode === 'manual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Nominal ATOM Asli</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 font-mono text-xs p-3 rounded-lg outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">ATOM</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Secret Salt (Kunci Rahasia)</label>
                    <input
                      type="text"
                      placeholder="Masukkan Salt Key"
                      value={manualSalt}
                      onChange={(e) => setManualSalt(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 font-mono text-xs p-3 rounded-lg outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Hash Match Status Panel */}
              {(manualAmount && manualSalt) && (
                <div className={`p-4 border rounded-lg animate-in fade-in duration-300 font-mono text-xs space-y-2 ${
                  hashesMatch
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">
                      {hashesMatch ? 'verified_user' : 'gpp_maybe'}
                    </span>
                    {hashesMatch ? 'DATA DEKRIPSI COCOK ✓' : 'DATA DEKRIPSI TIDAK COCOK ✗'}
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200 pb-1">
                      <span className="opacity-70">Hash Terkomit:</span>
                      <span className="text-gray-800 break-all font-mono">{selectedBid.hash}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between pt-1">
                      <span className="opacity-70">Hash Hasil Dekripsi:</span>
                      <span className="break-all font-mono">{localComputedHash || 'Kalkulasi gagal...'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleReveal}
                disabled={!hashesMatch}
                className={`w-full text-xs uppercase tracking-widest font-bold py-4 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  hashesMatch
                    ? 'bg-primary text-white hover:bg-secondary shadow-md active:scale-[0.98]'
                    : 'bg-gray-100 border border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-lg">lock_open</span>
                Dekripsi & Buka Bid Rahasia
              </button>
            </div>
          )}

          {/* Reveal Success Screen */}
          {selectedBid && revealStatus === 'success' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 border border-green-300 flex items-center justify-center mx-auto text-green-600">
                  <span className="material-symbols-outlined text-2xl select-none">verified</span>
                </div>
                <h3 className="text-base text-green-700 font-bold">Verifikasi Sukses!</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Penawaran sebesar <strong className="text-gray-800">{parseFloat(manualAmount).toFixed(4)} ATOM</strong> pada aset <strong className="text-gray-800">"{selectedBid.assetName}"</strong> telah berhasil didekripsi, dicocokkan dengan hash, dan terverifikasi secara penuh.
                </p>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Aset:</span>
                  <span className="text-gray-800">{selectedBid.assetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nilai Penawaran Terungkap:</span>
                  <span className="text-secondary font-bold">{parseFloat(manualAmount).toFixed(4)} ATOM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Secret Salt:</span>
                  <span className="text-gray-800">{manualSalt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hash Komitmen:</span>
                  <span className="text-primary font-bold">{truncHash(selectedBid.hash)}</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-xs uppercase tracking-wider py-3.5 rounded-lg transition-all cursor-pointer font-bold"
              >
                Verifikasi Penawaran Lain
              </button>
            </div>
          )}
        </div>
      )}

      {/* Already Revealed Section */}
      {revealedBids.length > 0 && (
        <div className="bg-white border border-green-200 p-6 md:p-8 rounded-xl flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <span className="material-symbols-outlined text-green-500 text-2xl select-none">verified</span>
            <div>
              <h3 className="text-base text-gray-800 font-bold">Penawaran Terbuka & Terverifikasi</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">{revealedBids.length} penawaran sudah didekripsi secara lokal</p>
            </div>
          </div>

          <div className="space-y-2">
            {revealedBids.map((bid) => (
              <div
                key={bid.hash}
                className="p-4 rounded-lg border border-green-100 bg-green-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-green-600 text-xs">check</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-800 font-bold truncate">{bid.assetName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                        Hash: {truncHash(bid.hash)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-green-600 font-bold">{bid.amount ? `${bid.amount.toFixed(4)} ATOM` : 'Terungkap'}</p>
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200 text-[9px] uppercase font-bold tracking-wider">
                      Terbuka
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All revealed */}
      {bidsSubmitted.length > 0 && unrevealedBids.length === 0 && (
        <div className="bg-white border border-green-200 p-8 rounded-xl flex flex-col items-center justify-center text-center py-12 gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined text-3xl select-none">task_alt</span>
          </div>
          <div className="space-y-1 max-w-[380px]">
            <h3 className="text-base text-green-700 font-bold">Semua Penawaran Sudah Terbuka</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Seluruh komitmen penawaran Anda telah berhasil didekripsi dan diverifikasi. Anda dapat melihat status hasil atau menarik dana di halaman Riwayat & Klaim.
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="mt-2 bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors cursor-pointer"
          >
            Lihat Riwayat & Klaim
          </button>
        </div>
      )}
    </div>
  )
}
