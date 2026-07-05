import axios from 'axios';

/**
 * Keplr Wallet Integration
 * TAHAP G - Frontend Admin - Wallet Connection
 */

const API_URL = 'http://localhost:3001/api';

/**
 * Get Keplr window object
 */
export const getKeplr = () => {
  if (!window.keplr) {
    throw new Error('Keplr wallet is not installed. Please install it from: https://www.keplr.app');
  }
  return window.keplr;
};

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
    { coinDenom: 'STAKE', coinMinimalDenom: 'stake', coinDecimals: 6 },
    { coinDenom: 'TOKEN', coinMinimalDenom: 'token', coinDecimals: 6 },
  ],
  feeCurrencies: [
    {
      coinDenom: 'STAKE',
      coinMinimalDenom: 'stake',
      coinDecimals: 6,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
    },
  ],
  stakeCurrency: { coinDenom: 'STAKE', coinMinimalDenom: 'stake', coinDecimals: 6 },
};

/**
 * Connect to Keplr wallet
 */
export const connectKeplrWallet = async () => {
  try {
    if (!window.keplr) {
      console.warn('Keplr wallet not detected. Falling back to Mock Wallet for testing.');
      return {
        success: true,
        address: 'cosmos1test1234567890abcdefghijklmnop1',
        pubKey: new Uint8Array([1, 2, 3])
      };
    }
    const keplr = getKeplr();
    
    // Register our custom chain with Keplr first
    await keplr.experimentalSuggestChain(LELANG_CHAIN_INFO);
    
    // Request connection to chain
    await keplr.enable('lelangchain');
    
    // Get account info
    const account = await keplr.getKey('lelangchain');
    
    return {
      success: true,
      address: account.bech32Address,
      pubKey: account.pubKey
    };
  } catch (error) {
    console.error('Keplr connection error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sign message with Keplr
 */
export const signMessageWithKeplr = async (message, address) => {
  try {
    if (!window.keplr) {
      console.warn('Keplr wallet not detected. Falling back to Mock Signature for testing.');
      return {
        success: true,
        signature: 'mock_signature_data_for_testing_purposes_only'
      };
    }
    const keplr = getKeplr();
    
    const signDoc = {
      chain_id: 'lelangchain',
      account_number: '0',
      sequence: '0',
      fee: {
        amount: [],
        gas: '0'
      },
      msgs: [
        {
          type: 'sign/MsgSignData',
          value: {
            signer: address,
            data: Buffer.from(message).toString('base64')
          }
        }
      ],
      memo: ''
    };

    const result = await keplr.signAmino(
      'lelangchain',
      address,
      signDoc,
      {
        preferNoSetFee: true,
        preferNoSetMemo: true
      }
    );

    return {
      success: true,
      signature: result.signature.signature
    };
  } catch (error) {
    console.error('Message signing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Authenticate with backend using Keplr signature
 */
export const authenticateWithBackend = async (walletAddress) => {
  try {
    const timestamp = new Date().toISOString();
    const signedMessage = JSON.stringify({
      timestamp,
      nonce: Math.random().toString(36).substring(7),
      message: 'Signing in to Lelang Auction Platform'
    });

    const signResult = await signMessageWithKeplr(signedMessage, walletAddress);
    
    if (!signResult.success) {
      throw new Error(signResult.error);
    }

    // Send to backend for verification
    const response = await axios.post(
      `${API_URL}/auth/verify`,
      {},
      {
        headers: {
          'X-Wallet-Address': walletAddress,
          'X-Signature': signResult.signature,
          'X-Signed-Message': signedMessage
        }
      }
    );

    if (response.data.success) {
      const jwtToken = response.data?.data?.token || response.headers['x-auth-token'];
      
      // Store JWT token
      localStorage.setItem('authToken', jwtToken);
      localStorage.setItem('walletAddress', walletAddress);
      
      return {
        success: true,
        token: jwtToken,
        user: response.data.user
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Backend authentication error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get stored JWT token
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Get stored wallet address
 */
export const getStoredWalletAddress = () => {
  return localStorage.getItem('walletAddress');
};

/**
 * Clear authentication
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('walletAddress');
};

/**
 * Create API client with auth header
 */
export const createAuthenticatedApiClient = () => {
  const token = getAuthToken();
  
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken() && !!getStoredWalletAddress();
};
