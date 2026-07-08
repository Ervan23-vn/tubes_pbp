import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const BACKEND_URL = 'http://localhost:3001/api'

function toBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/**
 * Get Keplr wallet or throw error if not installed
 */
export function getKeplr() {
  const keplr = window.keplr

  if (!keplr) {
    throw new Error('Keplr wallet is not installed. Please install it from https://www.keplr.app')
  }

  return keplr
}

/**
 * Chain info for lelang-testnet (custom Cosmos chain)
 * Keplr needs this to know how to connect to our local chain.
 */
const LELANG_CHAIN_INFO = {
  chainId: 'lelangchain',
  chainName: 'Lelang Blockchain Testnet',
  rpc: 'http://localhost:26607',
  rest: 'http://localhost:1307',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'cosmos',
    bech32PrefixAccPub: 'cosmospub',
    bech32PrefixValAddr: 'cosmosvaloper',
    bech32PrefixValPub: 'cosmosvaloperpub',
    bech32PrefixConsAddr: 'cosmosvalcons',
    bech32PrefixConsPub: 'cosmosvalconspub',
  },
  currencies: [
    { coinDenom: 'LCT', coinMinimalDenom: 'ulct', coinDecimals: 6 },
    { coinDenom: 'TOKEN', coinMinimalDenom: 'token', coinDecimals: 6 },
  ],
  feeCurrencies: [
    {
      coinDenom: 'LCT',
      coinMinimalDenom: 'ulct',
      coinDecimals: 6,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: { coinDenom: 'LCT', coinMinimalDenom: 'ulct', coinDecimals: 6 },
}

/**
 * Connect to Keplr wallet
 */
export async function connectKeplrWallet() {
  if (!window.keplr) {
    console.warn('Keplr wallet not detected. Falling back to Mock Wallet for testing.');
    return {
      address: 'cosmos1test1234567890abcdefghijklmnop1',
      pubKey: new Uint8Array([1, 2, 3]),
      name: 'Mock Wallet User'
    };
  }
  const keplr = getKeplr()

  try {
    // Register our custom chain with Keplr first
    await keplr.experimentalSuggestChain(LELANG_CHAIN_INFO)

    // Enable the chain
    await keplr.enable('lelangchain')

    // Get the key
    const key = await keplr.getKey('lelangchain')

    return {
      address: key.bech32Address,
      pubKey: key.pubKey,
      name: key.name
    }
  } catch (error) {
    throw new Error(`Gagal koneksi Keplr: ${error.message}`)
  }
}

/**
 * Sign message with Keplr wallet
 */
export async function signMessageWithKeplr(message, address) {
  if (!window.keplr) {
    console.warn('Keplr wallet not detected. Falling back to Mock Signature for testing.');
    return {
      signature: 'mock_signature_data_for_testing_purposes_only',
      pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'mock_pub_key' }
    };
  }
  const keplr = getKeplr()

  try {
    const key = await keplr.getKey('lelangchain')

    // Sign using Amino format
    const signDoc = {
      chain_id: '',
      account_number: '0',
      sequence: '0',
      fee: {
        gas: '0',
        amount: []
      },
      msgs: [
        {
          type: 'sign/MsgSignData',
          value: {
            signer: address,
            data: toBase64(message)
          }
        }
      ],
      memo: ''
    }

    const result = await keplr.signAmino('lelangchain', address, signDoc)

    return {
      signature: result.signature,
      pub_key: result.pub_key
    }
  } catch (error) {
    throw new Error(`Gagal sign message: ${error.message}`)
  }
}

/**
 * Authenticate with backend using Keplr signature
 */
export async function authenticateWithBackend(walletAddress) {
  try {
    // Create message to sign
    const message = `Authenticate with Lelang Blockchain\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}\nNonce: ${uuidv4()}`

    // Sign message
    const { signature, pub_key } = await signMessageWithKeplr(message, walletAddress)

    // Send to backend
    const response = await axios.post(`${BACKEND_URL}/auth/verify`, {
      wallet_address: walletAddress,
      message: message,
      signature: signature,
      public_key: pub_key
    })

    if (!response.data.success) {
      throw new Error('Authentication failed')
    }

    // Store JWT token
    const token = response.data.data.token
    localStorage.setItem('jwt_token', token)
    localStorage.setItem('wallet_address', walletAddress)

    return {
      token,
      walletAddress
    }
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`)
  }
}

/**
 * Get stored JWT token
 */
export function getAuthToken() {
  return localStorage.getItem('jwt_token')
}

/**
 * Get stored wallet address
 */
export function getStoredWalletAddress() {
  return localStorage.getItem('wallet_address')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const token = getAuthToken()
  const wallet = getStoredWalletAddress()

  return !!(token && wallet)
}

/**
 * Logout - clear stored credentials
 */
export function logout() {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('wallet_address')
  localStorage.removeItem('bid_history')
}

/**
 * Create axios client with JWT token
 */
export function createAuthenticatedApiClient() {
  const token = getAuthToken()

  return axios.create({
    baseURL: BACKEND_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Fetch wallet balance from Cosmos REST API
 */
export async function getWalletBalance(address) {
  try {
    const restUrl = LELANG_CHAIN_INFO.rest
    const response = await axios.get(`${restUrl}/cosmos/bank/v1beta1/balances/${address}`)
    if (response.data && Array.isArray(response.data.balances)) {
      const stakeBal = response.data.balances.find(b => b.denom === 'ulct')
      if (stakeBal) {
        // Divide by 10^6 because decimals is 6
        return parseFloat(stakeBal.amount) / 1000000
      }
    }
    return 0
  } catch (error) {
    console.warn('Gagal mengambil saldo dari node REST blockchain, menggunakan fallback 500.00:', error.message)
    return 500.00 // fallback to mock balance if node is not reachable for UX demo
  }
}
