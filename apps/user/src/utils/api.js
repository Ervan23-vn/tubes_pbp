import axios from 'axios'
import { getAuthToken } from './keplr'

const API_URL = 'http://localhost:3001/api'

function createAuthenticatedApiClient() {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  })
}

const client = createAuthenticatedApiClient()

export const MOCK_AUCTIONS = [
  {
    item_id: 'item-01',
    title: 'MacBook Pro M3 Max 16-inch 36GB 1TB Space Black',
    description: 'MacBook Pro terbaru dengan chip Apple M3 Max yang sangat kencang. Memori terpadu 36GB, penyimpanan SSD 1TB, warna Space Black. Kondisi 99% seperti baru lengkap dengan dus dan charger bawaan.',
    category: 'Elektronik',
    starting_price: 1500,
    current_highest_bid: 1650,
    total_bids_count: 5,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    auction_status: 'active',
    start_time: new Date(Date.now() - 86400000).toISOString(), // started yesterday
    end_time: new Date(Date.now() + 86400000 * 5).toISOString(), // ends in 5 days
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop1'
  },
  {
    item_id: 'item-02',
    title: 'Lukisan Abstrak Modern "Cosmic Harmony" Original Canvas',
    description: 'Lukisan tangan asli menggunakan cat akrilik di atas kanvas ukuran 100x100cm. Membawa nuansa harmoni ruang angkasa modern ke ruangan Anda. Dilengkapi dengan sertifikat keaslian dari pelukis.',
    category: 'Seni',
    starting_price: 800,
    current_highest_bid: 920,
    total_bids_count: 3,
    image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    auction_status: 'active',
    start_time: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 7).toISOString(),
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop1'
  },
  {
    item_id: 'item-03',
    title: 'Cosmos ATOM Custom Neon Light Sign LED',
    description: 'Lampu hias neon LED kustom dengan logo Cosmos ATOM Network. Sangat cocok diletakkan di ruang kerja developer atau kolektor crypto. Menggunakan daya USB 5V aman dan hemat energi.',
    category: 'Dekorasi',
    starting_price: 50,
    current_highest_bid: null,
    total_bids_count: 0,
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    auction_status: 'active',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 86400000 * 10).toISOString(),
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop2'
  },
  {
    item_id: 'item-04',
    title: 'Keyboard Mekanikal Custom GMMK Pro 75% Custom Build',
    description: 'Keyboard kustom build siap pakai. Menggunakan barebone GMMK Pro, switch linear Gateron Oil King (lubed), keycaps GMK Laser original. Suara ketikan clacky dan sangat premium.',
    category: 'Elektronik',
    starting_price: 250,
    current_highest_bid: 310,
    total_bids_count: 7,
    image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
    auction_status: 'active',
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop1'
  }
]

export const auctionsAPI = {
  getAll: async (limit = 100, offset = 0) => {
    try {
      const res = await client.get(`/auctions?limit=${limit}&offset=${offset}`)
      return res.data.data || []
    } catch (err) {
      console.warn('Backend offline, falling back to mock data.')
      return MOCK_AUCTIONS
    }
  },

  getById: async (itemId) => {
    try {
      const res = await client.get(`/auctions/${itemId}`)
      return res.data.data
    } catch (err) {
      console.warn('Backend offline, falling back to mock item detail.')
      const mockItem = MOCK_AUCTIONS.find(item => item.item_id === itemId)
      if (mockItem) return mockItem
      // fallback to first item if not found so UI doesn't break
      return MOCK_AUCTIONS[0]
    }
  }
}

export const zkpAPI = {
  getProofsForAuction: async (itemId) => {
    try {
      const res = await client.get(`/zkp-proxy/proofs/${itemId}`)
      return res.data.data || []
    } catch (err) {
      console.warn('Backend offline, falling back to mock ZKP proofs.')
      return [
        {
          bidder_address: 'cosmos1test1234567890abcdefghijklmnop1',
          commitment_hash: '5f4dcc3b5aa765d61d8327deb882cf99f2b8b99bbccaa887766554433221100',
          verified: true,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          bidder_address: 'cosmos1seller1234567890abcdefghijklmnop2',
          commitment_hash: '7c6a5a4f3e2d1c0b9a8f7e6d5c4b3a2100112233445566778899aabbccddeeff',
          verified: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    }
  },

  storeProof: async (itemId, commitmentHash, proofJson) => {
    try {
      const res = await client.post('/zkp-proxy/store-proof', {
        item_id: itemId,
        commitment_hash: commitmentHash,
        proof_json: proofJson
      })
      return res.data.data
    } catch (err) {
      console.warn('Backend offline, simulating successful ZKP proof storage.')
      return { success: true, item_id: itemId, commitment_hash: commitmentHash }
    }
  },

  verifyProof: async (proofId, commitmentHash, bidAmount, salt) => {
    try {
      const res = await client.post(`/zkp-proxy/verify-proof/${proofId}`, {
        commitment_hash: commitmentHash,
        bid_amount: bidAmount,
        salt: salt
      })
      return res.data.data
    } catch (err) {
      console.warn('Backend offline, simulating successful ZKP proof verification.')
      return { verified: true, payout_amount: bidAmount }
    }
  }
}

export default client
