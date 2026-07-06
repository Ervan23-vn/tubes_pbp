import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export const getKeplr = () => {
  if (!window.keplr) {
    throw new Error('Keplr wallet is not installed.');
  }
  return window.keplr;
};

const LELANG_CHAIN_INFO = {
  chainId: 'lelang-testnet',
  chainName: 'Lelang Blockchain Testnet',
  rpc: 'http://localhost:26657',
  rest: 'http://localhost:1317',
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

export const connectKeplrWallet = async () => {
  if (!window.keplr) {
    console.warn('Keplr not detected, using mock wallet.');
    return {
      address: 'cosmos1test1234567890abcdefghijklmnop1',
      pubKey: new Uint8Array([1, 2, 3]),
      name: 'Mock Admin Wallet'
    };
  }

  const keplr = getKeplr();
  try {
    await keplr.experimentalSuggestChain(LELANG_CHAIN_INFO);
    await keplr.enable('lelang-testnet');
    const key = await keplr.getKey('lelang-testnet');
    return {
      address: key.bech32Address,
      pubKey: key.pubKey,
      name: key.name
    };
  } catch (error) {
    throw new Error('Gagal koneksi Keplr: ' + error.message);
  }
};

/**
 * Sign message with Keplr using ADR-36 format
 * ADR-36 requires chain_id = "" (empty string)
 */
export const signMessageWithKeplr = async (message, address) => {
  if (!window.keplr) {
    console.warn('Keplr not detected, using mock signature.');
    return {
      signature: 'mock_signature_data_for_testing_purposes_only',
      pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'mock_pub_key' }
    };
  }

  const keplr = getKeplr();
  try {
    // ADR-36: chain_id MUST be empty string ""
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
    };

    const result = await keplr.signAmino(
      'lelang-testnet',
      address,
      signDoc,
      {
        preferNoSetFee: true,
        preferNoSetMemo: true
      }
    );

    return {
      signature: result.signature,
      pub_key: result.pub_key
    };
  } catch (error) {
    throw new Error('Gagal sign message: ' + error.message);
  }
};

export const authenticateWithBackend = async (walletAddress) => {
  try {
    const timestamp = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(7);
    const message = 'Authenticate with Lelang Blockchain\nWallet: ' + walletAddress + '\nTimestamp: ' + timestamp + '\nNonce: ' + nonce;

    const { signature, pub_key } = await signMessageWithKeplr(message, walletAddress);

    const response = await axios.post(
      API_URL + '/auth/verify',
      {
        wallet_address: walletAddress,
        message: message,
        signature: typeof signature === 'object' ? signature.signature : signature,
        public_key: pub_key
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Authentication failed');
    }

    const token = (response.data.data && response.data.data.token) || response.data.token || response.headers['x-auth-token'];

    if (!token) {
      throw new Error('No authentication token received');
    }

    localStorage.setItem('authToken', token);
    localStorage.setItem('walletAddress', walletAddress);

    return { success: true, token: token, user: response.data.user };
  } catch (error) {
    console.error('Backend authentication error:', error);
    return { success: false, error: error.message };
  }
};

export const getAuthToken = () => localStorage.getItem('authToken');
export const getStoredWalletAddress = () => localStorage.getItem('walletAddress');
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('walletAddress');
};
export const createAuthenticatedApiClient = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': 'Bearer ' + token })
    }
  });
};
export const isAuthenticated = () => !!getAuthToken() && !!getStoredWalletAddress();
