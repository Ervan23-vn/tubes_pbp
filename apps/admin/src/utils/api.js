import axios from 'axios'
import { getAuthToken } from './keplr'

const API_URL = 'http://localhost:3001/api'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

client.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const auctionsAPI = {
  getAll: async (limit = 50, offset = 0) => {
    const res = await client.get('/auctions', { params: { limit, offset } })
    return res.data
  },

  getById: async (itemId) => {
    const res = await client.get(`/auctions/${itemId}`)
    return res.data
  },

  create: async (auctionData) => {
    const res = await client.post('/auctions', auctionData)
    return res.data
  },

  getSellerAuctions: async () => {
    const res = await client.get('/auctions/seller/me')
    return res.data
  },

  updateStatus: async (itemId, status) => {
    const res = await client.put(`/auctions/${itemId}/status`, { auction_status: status })
    return res.data
  }
}

export const usersAPI = {
  getMe: async () => {
    const res = await client.get('/users/me')
    return res.data
  },

  updateProfile: async (profileData) => {
    const res = await client.put('/users/me', profileData)
    return res.data
  },

  getStats: async () => {
    const res = await client.get('/users/me/stats')
    return res.data
  }
}

export const notificationsAPI = {
  getList: async (limit = 20, offset = 0) => {
    const res = await client.get('/notifications', { params: { limit, offset } })
    return res.data
  },

  markAsRead: async (notificationId) => {
    const res = await client.put(`/notifications/${notificationId}/read`)
    return res.data
  },

  getUnreadCount: async () => {
    const res = await client.get('/notifications/unread-count')
    return res.data
  }
}

export const uploadAPI = {
  uploadImage: async (file, purpose = 'auction') => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('purpose', purpose)

    const res = await client.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  }
}

export const zkpAPI = {
  storeProof: async (itemId, commitmentHash, proofJson) => {
    const res = await client.post('/zkp-proxy/store-proof', {
      item_id: itemId,
      commitment_hash: commitmentHash,
      proof_json: proofJson
    })
    return res.data
  },

  getProofsForAuction: async (itemId) => {
    const res = await client.get(`/zkp-proxy/proofs/${itemId}`)
    return res.data
  }
}

export default client


/**
 * Helper to resolve image URL with Backend address if relative
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url : '/' + url;
  return `http://localhost:3001${cleanUrl}`;
};
