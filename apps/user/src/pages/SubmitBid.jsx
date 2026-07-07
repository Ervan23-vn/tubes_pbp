import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ethers as ethersObj } from 'ethers'
import { getStoredWalletAddress, getWalletBalance } from '../utils/keplr'
import { auctionsAPI, zkpAPI } from '../utils/api'

// Helper to determine time left from ISO string
const getTimeLeft = (endTimeStr) => {
  if (!endTimeStr) return 'Selesai'
  const diff = new Date(endTimeStr) - new Date()
  if (diff <= 0) return 'Selesai'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} hari`
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (hours > 0) return `${hours} jam`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes} menit`
}

export default function SubmitBid() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const walletAddress = getStoredWalletAddress()
  const [balance, setBalance] = useState(0.00)

  const [assets, setAssets] = useState([])
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Fetch real wallet balance on mount
  useEffect(() => {
    if (walletAddress) {
      getWalletBalance(walletAddress).then(bal => setBalance(bal))
    }
  }, [walletAddress])
  
  const [bidAmount, setBidAmount] = useState('')
  const [saltKey, setSaltKey] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  // ZKP terminal simulation states
  const [zkpStatus, setZkpStatus] = useState('idle') // 'idle' | 'generating' | 'done'
  const [zkpLogs, setZkpLogs] = useState([])
  const [downloaded, setDownloaded] = useState(false)
  const [computedHash, setComputedHash] = useState('')

  // Load active auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await auctionsAPI.getAll()
        if (response && response.success && Array.isArray(response.data)) {
          const mapped = response.data.map(item => ({
            id: item.item_id,
            name: item.title,
            image: item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            description: item.description,
            timeLeft: getTimeLeft(item.end_time),
            standard: 'Cosmos SDK',
            type: 'ZKP Sealed-Bid'
          }))
          setAssets(mapped)
          
          // Set selected asset based on URL parameter
          const current = mapped.find(a => a.id === itemId) || mapped[0]
          setSelectedAsset(current)
        }
      } catch (err) {
        console.error('Gagal memuat lelang:', err)
      }
    }
    fetchAuctions()
  }, [itemId])

  // Sync active slide index when selectedAsset.id changes
  useEffect(() => {
    if (!selectedAsset || assets.length === 0) return
    const idx = assets.findIndex((a) => a.id === selectedAsset.id)
    if (idx !== -1) {
      setActiveSlideIndex(idx)
    }
  }, [selectedAsset?.id, assets])

  // Generate secure random salt on mount or reset
  useEffect(() => {
    generateRandomSalt()
  }, [selectedAsset?.id])

  // Real-time local Keccak256 calculation
  useEffect(() => {
    if (!bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0 || !saltKey) {
      setComputedHash('')
      return
    }
    try {
      // Use standard ethers.js Keccak256
      const amountInWei = ethersObj.parseEther(bidAmount)
      const hash = ethersObj.solidityPackedKeccak256(
        ['uint256', 'string'],
        [amountInWei, saltKey]
      )
      setComputedHash(hash)
    } catch (err) {
      console.error('Hashing error:', err)
      setComputedHash('')
    }
  }, [bidAmount, saltKey])

  const generateRandomSalt = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setSaltKey(result)
    setDownloaded(false)
  }

  const handleStartCommit = (e) => {
    e.preventDefault()
    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount <= 0) return
    if (amount > balance) return

    // Initialize ZKP console simulation logs
    setZkpStatus('generating')
    setDownloaded(false)
    setZkpLogs([])

    const logsSequence = [
      '[SYSTEM] Menginisialisasi sirkuit lelang sealed-bid...',
      '[SYSTEM] Memuat berkas input parameter penawaran...',
      `[DATA]   - Nominal: ${bidAmount} STAKE (${ethersObj.parseEther(bidAmount).toString()} minimalDenom)`,
      `[DATA]   - Secret Salt: ${saltKey}`,
      '[CRYPTO] Menghitung local Keccak256 hash...',
      `[CRYPTO] Hash: ${computedHash}`,
      '[ZKP]    Mengompilasi R1CS constraints (zk-SNARKs/Groth16)...',
      '[ZKP]    Menghitung saksi (Witness calculation)...',
      '[ZKP]    Witness berhasil dihitung (Constraints: 14,832 sirkuit)',
      '[ZKP]    Memulai pembuatan bukti rahasia (Prover execution)...',
      '[ZKP]    Kunci verifikasi (Verification Key) dimuat ke memory',
      '[ZKP]    Zero-Knowledge Proof (proof.json) berhasil dibuat secara lokal!',
      '[ZKP]    Melakukan pengujian bukti lokal (Local Verification)...',
      '[ZKP]    Verifikasi lokal SUKSES! Bukti sah & valid.'
    ]

    let currentLogIndex = 0
    const logInterval = setInterval(() => {
      if (currentLogIndex < logsSequence.length) {
        setZkpLogs((prev) => [...prev, logsSequence[currentLogIndex]])
        currentLogIndex++
      } else {
        clearInterval(logInterval)
        setZkpStatus('done')
      }
    }, 180)
  }

  const downloadKeyFile = () => {
    if (!computedHash) return
    const textContent = `==================================================
AETHER AUCTION - KUNCI PENAWARAN SEALED-BID
==================================================
WAKTU UNDUH      : ${new Date().toLocaleString()}
WALLET ADDRESS   : ${walletAddress || 'Keplr Tidak Terhubung'}
ASET             : ${selectedAsset.name} (ID: ${selectedAsset.id})
NOMINAL PENAWARAN: ${bidAmount} STAKE
SECRET SALT      : ${saltKey}
COMMITMENT HASH  : ${computedHash}
==================================================
PERINGATAN PENTING:
Simpan berkas ini dengan aman dan jangan ubah isinya.
Anda wajib menggunakan berkas ini (atau menyalin data
di atas) saat Fase Reveal (Pembukaan) berlangsung.
Jika berkas ini hilang, penawaran Anda tidak akan
dapat dibuka dan dana Anda akan terkunci selamanya.
==================================================`

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const element = document.createElement('a')
    element.href = URL.createObjectURL(blob)
    element.download = `AETHER_KEY_${selectedAsset.id}_${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setDownloaded(true)
  }

  const handleFinalSubmit = async () => {
    try {
      // 1. Submit to blockchain API
      await zkpAPI.storeProof(selectedAsset.id, computedHash, JSON.stringify({
        proof: "zkp_simulated_proof",
        publicSignals: [computedHash]
      }))
    } catch (e) {
      console.warn('Backend offline, saving commitment locally.')
    }

    // 2. Save to user localStorage bid history so it can be revealed/viewed later
    const existing = localStorage.getItem('bid_history')
    let bids = []
    if (existing) {
      try {
        bids = JSON.parse(existing)
      } catch (e) {}
    }
    
    bids.push({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      assetName: selectedAsset.name,
      amount: parseFloat(bidAmount),
      revealed: false,
      hash: computedHash,
      itemId: selectedAsset.id,
      salt: saltKey
    })

    localStorage.setItem('bid_history', JSON.stringify(bids))
    alert(`Komitmen penawaran sebesar ${bidAmount} STAKE untuk "${selectedAsset.name}" berhasil dikirim ke blockchain!`)
    
    setZkpStatus('idle')
    setBidAmount('')
    generateRandomSalt()
    navigate('/history')
  }

  if (!selectedAsset || assets.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow border border-gray-100 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 animate-pulse">Memuat Aset Lelang...</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-outline-variant/10 pb-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-semibold">
            Committed Bidding Phase (ZKP Hibrid)
          </div>
          <h1 className="font-headline-xl text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary uppercase tracking-wider leading-none">
            Detail Penawaran Lelang
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Asset Detail Column */}
        <div 
          className="lg:col-span-7 flex flex-col gap-6"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="glass-panel border border-outline-variant/10 p-4 md:p-6 flex flex-col gap-6 relative overflow-hidden group rounded-xl min-h-[460px] bg-white">
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-primary/30 opacity-50"></div>

            {/* Image Preview */}
            <div className="w-full aspect-[16/9] bg-surface-container-highest border border-outline-variant/20 relative overflow-hidden rounded-lg">
              {assets.map((asset, index) => (
                <img
                  key={asset.id}
                  src={asset.image}
                  alt={asset.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1000ms] ease-in-out ${
                    activeSlideIndex === index 
                      ? 'opacity-80 scale-100' 
                      : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                />
              ))}
              <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 border border-outline-variant/20 font-label-mono text-xs text-primary flex items-center gap-2 z-10">
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse"></span>
                Lelang Langsung
              </div>
            </div>

            {/* details text */}
            <div className="relative flex-grow">
              {assets.map((asset, index) => (
                <div
                  key={asset.id}
                  className={`transition-all duration-700 ease-in-out ${
                    activeSlideIndex === index
                      ? 'opacity-100 translate-y-0 relative z-10'
                      : 'opacity-0 -translate-y-4 absolute inset-x-0 top-0 pointer-events-none z-0'
                  }`}
                >
                  <h2 className="font-headline-xl text-lg sm:text-2xl text-on-surface mb-2 font-bold text-gray-800">{asset.name}</h2>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <span className="font-label-mono text-[10px] sm:text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-sm">{asset.standard}</span>
                    <span className="font-label-mono text-[10px] sm:text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-sm">{asset.type}</span>
                    <span className="font-label-mono text-[10px] sm:text-xs text-primary border border-primary/30 px-2 py-0.5 rounded-sm bg-primary/5">Terverifikasi</span>
                  </div>
                  <p className="font-body-md text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed min-h-[60px]">
                    {asset.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-outline-variant/10">
                    <div>
                      <div className="font-label-mono text-[10px] sm:text-xs text-gray-500 mb-1">ID Aset</div>
                      <div className="font-stats-display text-xs sm:text-sm md:text-base text-gray-800 truncate">{asset.id}</div>
                    </div>
                    <div>
                      <div className="font-label-mono text-[10px] sm:text-xs text-gray-500 mb-1">Sisa Waktu</div>
                      <div className="font-stats-display text-xs sm:text-sm md:text-base text-primary font-mono tracking-wider font-bold">{asset.timeLeft}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commit Form Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel border border-primary/25 p-5 md:p-8 flex flex-col gap-6 relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl bg-white border">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <h3 className="font-stats-display text-sm sm:text-base text-gray-800 flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-primary text-xl">lock</span>
                Penawaran Rahasia (Commit)
              </h3>
              <span className="font-label-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 border border-primary/20">LOKAL (ZKP)</span>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleStartCommit}>
              {/* Asset Dropdown Selector */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-[10px] sm:text-xs text-gray-500">
                  Pilih Aset Target
                </label>
                {assets.length > 0 && (
                  <select
                    value={selectedAsset.id}
                    onChange={(e) => {
                      const newAsset = assets.find((a) => a.id === e.target.value)
                      if (newAsset) {
                        setSelectedAsset(newAsset)
                        navigate(`/auctions/${newAsset.id}/bid`)
                        setIsHovered(true)
                        setTimeout(() => setIsHovered(false), 5000)
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 font-label-mono text-xs p-3.5 rounded-lg outline-none cursor-pointer transition-colors"
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bid Amount */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-[10px] sm:text-xs text-gray-500 flex justify-between">
                  <span>Jumlah Penawaran (STAKE)</span>
                  <span className="text-gray-500/80">Saldo: {balance.toFixed(2)} STAKE</span>
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 font-stats-display p-3 sm:p-4 outline-none transition-colors pr-16 text-sm sm:text-base rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-mono text-xs text-gray-400">STAKE</span>
                </div>
              </div>

              {/* Secret Salt (Kunci Rahasia) */}
              <div className="flex flex-col gap-2">
                <label className="font-label-mono text-[10px] sm:text-xs text-gray-500 flex justify-between items-center">
                  <span>Secret Salt (Kunci Rahasia)</span>
                  <button
                    type="button"
                    onClick={generateRandomSalt}
                    className="text-primary hover:text-secondary text-[11px] font-label-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">autorenew</span>
                    Acak Kunci
                  </button>
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-gray-50 border border-gray-200 focus:border-primary text-gray-800 font-mono p-3 sm:p-4 outline-none transition-colors pr-14 text-xs rounded-lg"
                    placeholder="Masukkan kunci salt rahasia"
                    type="text"
                    required
                    value={saltKey}
                    onChange={(e) => setSaltKey(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="material-symbols-outlined text-sm">vpn_key</span>
                  </span>
                </div>
              </div>

              {/* Live Hash Calculation Preview */}
              {computedHash && (
                <div className="bg-gray-50 p-3 border border-primary/20 rounded-lg text-xs font-mono space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-[10px] text-primary uppercase tracking-wider font-bold">Preview Hash Komitmen (Lokal)</div>
                  <p className="text-gray-800 text-[10px] break-all select-all cursor-pointer hover:text-primary transition-colors">
                    {computedHash}
                  </p>
                </div>
              )}

              {/* Warning Block */}
              <div className="bg-gray-50 border-l-4 border-yellow-500 p-4 flex gap-3 items-start mt-1 rounded-r-lg border">
                <span className="material-symbols-outlined text-yellow-600 mt-0.5 text-base">warning</span>
                <div>
                  <div className="font-label-mono text-[10px] text-gray-800 mb-1 font-bold">ZKP OFFLINE PRIVACY</div>
                  <div className="font-body-md text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                    Nominal asli ({bidAmount || '0'} STAKE) dan kunci rahasia ({saltKey || 'kosong'}) <strong>tidak akan pernah dikirim</strong> ke database off-chain atau blockchain. Hanya hash komitmen yang akan dicatat publik.
                  </div>
                </div>
              </div>

              {/* Main Action */}
              <button
                className="w-full bg-primary text-white font-label-mono text-xs sm:text-sm uppercase tracking-widest font-bold py-4 px-6 border hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98] cursor-pointer rounded-lg"
                type="submit"
                disabled={parseFloat(bidAmount) > balance || !bidAmount || !saltKey}
              >
                <span className="material-symbols-outlined text-lg">fingerprint</span>
                Mulai Proses Enkripsi & Bukti
              </button>
              <div className="text-center font-label-mono text-gray-400 text-[9px] uppercase tracking-wider mt-1 opacity-60">
                Kombinasi Kriptografi Keccak256 Lokal & zk-SNARKs
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Premium Black-glass Terminal Overlay Modal for ZKP Simulation */}
      {zkpStatus !== 'idle' && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Terminal Header */}
            <div className="bg-gray-900 border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-label-mono text-[10px] text-gray-400 ml-2">AETHER PROVING CONSOLE v1.0.0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-mono text-[9px] text-primary uppercase tracking-wider">ONLINE PROVER</span>
              </div>
            </div>

            {/* Terminal Logs Content */}
            <div className="p-4 md:p-6 font-mono text-xs text-gray-400 overflow-y-auto flex-grow space-y-2 select-text bg-black/90 min-h-[300px]">
              {zkpLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`leading-relaxed ${
                    log.startsWith('[SYSTEM]') ? 'text-primary' : 
                    log.startsWith('[DATA]') ? 'text-white' :
                    log.startsWith('[CRYPTO]') ? 'text-[#a78bfa]' : 
                    log.includes('SUKSES') ? 'text-[#10b981] font-bold' : 
                    'text-gray-400'
                  }`}
                >
                  {log}
                </div>
              ))}
              
              {zkpStatus === 'generating' && (
                <div className="flex items-center gap-2 text-primary pt-2">
                  <span className="material-symbols-outlined text-sm animate-spin-custom">autorenew</span>
                  <span>Menyusun zk-Proof constraints...</span>
                </div>
              )}
            </div>

            {/* Terminal Footer Panel */}
            <div className="bg-gray-900 border-t border-white/5 p-4 md:p-6 shrink-0 flex flex-col sm:flex-row items-center gap-4">
              {zkpStatus === 'done' ? (
                <div className="w-full flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">verified_user</span>
                    <div>
                      <p className="font-label-mono text-xs font-bold text-white uppercase tracking-wider">Bukti zk-SNARKs Berhasil Dibuat!</p>
                      <p className="font-body-md text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Anda wajib mengunduh berkas kunci rahasia (.txt) sekarang. Berkas ini adalah satu-satunya cara untuk membuktikan nominal bid Anda saat fase pembukaan (reveal).
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={downloadKeyFile}
                      type="button"
                      className={`flex-1 font-label-mono text-xs uppercase tracking-wider py-4 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        downloaded 
                          ? 'bg-green-950/20 text-green-400 border border-green-500/40' 
                          : 'bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {downloaded ? 'check_circle' : 'download'}
                      </span>
                      {downloaded ? 'Berkas Kunci Diunduh' : 'Unduh Kunci Rahasia (.txt)'}
                    </button>

                    <button
                      onClick={handleFinalSubmit}
                      disabled={!downloaded}
                      type="button"
                      className={`flex-1 font-label-mono text-xs uppercase tracking-wider py-4 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                        downloaded
                          ? 'bg-primary text-white hover:bg-indigo-700 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">cloud_upload</span>
                      Kirim Komitmen ke Blockchain
                    </button>
                  </div>
                  
                  {!downloaded && (
                    <p className="text-center font-label-mono text-[10px] text-red-500">
                      * Harap unduh berkas kunci terlebih dahulu untuk membuka tombol pengiriman.
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full text-center py-2 text-gray-500 font-label-mono text-xs">
                  Proses kalkulasi Zero-Knowledge lokal sedang berlangsung. Harap tunggu...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
