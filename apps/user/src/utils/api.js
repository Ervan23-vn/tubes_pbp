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
  getAll: async (limit = 100, offset = 0) => {
    const res = await client.get(`/auctions?limit=${limit}&offset=${offset}`)
    return res.data
  },

  getById: async (itemId) => {
    const res = await client.get(`/auctions/${itemId}`)
    return res.data
  },

  reveal: async (itemId, data) => {
    const res = await client.post(`/auctions/${itemId}/reveal`, data)
    return res.data
  },

  claim: async (itemId) => {
    const res = await client.post(`/auctions/${itemId}/claim`)
    return res.data
  },

  refund: async (itemId) => {
    const res = await client.post(`/auctions/${itemId}/refund`)
    return res.data
  }
}

export const zkpAPI = {
  getProofsForAuction: async (itemId) => {
    const res = await client.get(`/zkp-proxy/proofs/${itemId}`)
    return res.data
  },

  storeProof: async (itemId, commitmentHash, proofJson) => {
    const res = await client.post('/zkp-proxy/store-proof', {
      item_id: itemId,
      commitment_hash: commitmentHash,
      proof_json: proofJson
    })
    return res.data
  },

  verifyProof: async (proofId, commitmentHash, bidAmount, salt) => {
    const res = await client.post(`/zkp-proxy/verify-proof/${proofId}`, {
      commitment_hash: commitmentHash,
      bid_amount: bidAmount,
      salt: salt
    })
    return res.data
  }
}

export default client
