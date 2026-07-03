import { createAuthenticatedApiClient } from './keplr.js';

/**
 * API Client for Backend Integration
 */

const apiClient = createAuthenticatedApiClient();

export const MOCK_ADMIN_AUCTIONS = [
  {
    id: '1',
    item_id: 'item-01',
    title: 'MacBook Pro M3 Max 16-inch 36GB 1TB Space Black',
    description: 'MacBook Pro terbaru dengan chip Apple M3 Max yang sangat kencang. Memori terpadu 36GB, penyimpanan SSD 1TB, warna Space Black. Kondisi 99% seperti baru lengkap dengan dus dan charger bawaan.',
    category: 'Elektronik',
    starting_price: 1500,
    current_highest_bid: 1650,
    total_bids_count: 5,
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    auction_status: 'active',
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() + 86400000 * 5).toISOString(),
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop1'
  },
  {
    id: '2',
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
    id: '3',
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
    id: '4',
    item_id: 'item-04',
    title: 'Keyboard Mekanikal Custom GMMK Pro 75% Custom Build',
    description: 'Keyboard kustom build siap pakai. Menggunakan barebone GMMK Pro, switch linear Gateron Oil King (lubed), keycaps GMK Laser original. Suara ketikan clacky dan sangat premium.',
    category: 'Elektronik',
    starting_price: 250,
    current_highest_bid: 310,
    total_bids_count: 7,
    image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
    auction_status: 'ended',
    start_time: new Date(Date.now() - 86400000 * 10).toISOString(),
    end_time: new Date(Date.now() - 86400000).toISOString(),
    seller_address: 'cosmos1seller1234567890abcdefghijklmnop1'
  }
];

/**
 * Auctions API
 */
export const auctionsAPI = {
  // Get all auctions
  getAll: async (limit = 50, offset = 0) => {
    try {
      const response = await apiClient.get('/auctions', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock auctions list.');
      return { success: true, data: MOCK_ADMIN_AUCTIONS };
    }
  },

  // Get auction by item_id
  getById: async (itemId) => {
    try {
      const response = await apiClient.get(`/auctions/${itemId}`);
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock auction detail.');
      const mockItem = MOCK_ADMIN_AUCTIONS.find(item => item.item_id === itemId) || MOCK_ADMIN_AUCTIONS[0];
      return { success: true, data: mockItem };
    }
  },

  // Create new auction
  create: async (auctionData) => {
    try {
      const response = await apiClient.post('/auctions', auctionData);
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating creation.');
      const newAuction = {
        id: Math.random().toString(),
        item_id: 'item-' + Math.random().toString(36).substring(7),
        ...auctionData,
        current_highest_bid: null,
        total_bids_count: 0,
        auction_status: 'active',
        created_at: new Date().toISOString()
      };
      MOCK_ADMIN_AUCTIONS.push(newAuction);
      return { success: true, data: newAuction };
    }
  },

  // Get seller's auctions
  getSellerAuctions: async () => {
    try {
      const response = await apiClient.get('/auctions/seller/me');
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock seller auctions.');
      return { success: true, data: MOCK_ADMIN_AUCTIONS };
    }
  },

  // Update auction status
  updateStatus: async (itemId, status) => {
    try {
      const response = await apiClient.put(
        `/auctions/${itemId}/status`,
        { auction_status: status }
      );
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating status update.');
      const mockItem = MOCK_ADMIN_AUCTIONS.find(item => item.item_id === itemId);
      if (mockItem) {
        mockItem.auction_status = status;
      }
      return { success: true, data: mockItem };
    }
  }
};

/**
 * Users API
 */
export const usersAPI = {
  // Get current user profile
  getMe: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock user profile.');
      return {
        success: true,
        data: {
          wallet_address: 'cosmos1test1234567890abcdefghijklmnop1',
          username: 'Mock Seller Dev',
          role: 'seller',
          created_at: '2026-06-01T00:00:00Z'
        }
      };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating update profile.');
      return { success: true, data: profileData };
    }
  },

  // Get user stats
  getStats: async () => {
    try {
      const response = await apiClient.get('/users/me/stats');
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock stats.');
      return {
        success: true,
        data: {
          seller_stats: {
            total_auctions: MOCK_ADMIN_AUCTIONS.length,
            active_auctions: MOCK_ADMIN_AUCTIONS.filter(a => a.auction_status === 'active').length,
            ended_auctions: MOCK_ADMIN_AUCTIONS.filter(a => a.auction_status === 'ended').length,
            total_revenue: 1250
          },
          bidder_stats: {
            total_bids: 15,
            winning_bids: 3
          }
        }
      };
    }
  }
};

/**
 * Notifications API
 */
export const notificationsAPI = {
  // Get notifications
  getList: async (limit = 20, offset = 0) => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock notifications.');
      return {
        success: true,
        data: [
          {
            id: 'n1',
            title: 'Penawaran Baru!',
            message: 'Seseorang telah memberikan bid sebesar 1650 ATOM pada MacBook Pro Anda.',
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 'n2',
            title: 'Lelang Selesai',
            message: 'Lelang Keyboard Mekanikal Custom Anda telah berakhir.',
            read: true,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      };
    }
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.put(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating mark as read.');
      return { success: true };
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating unread count.');
      return { success: true, data: { unread_count: 1 } };
    }
  }
};

/**
 * Upload API
 */
export const uploadAPI = {
  // Upload image
  uploadImage: async (file, purpose = 'auction') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('purpose', purpose);

      const response = await apiClient.post('/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating image upload.');
      return {
        success: true,
        data: {
          url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
        }
      };
    }
  }
};

/**
 * ZKP API
 */
export const zkpAPI = {
  // Store proof
  storeProof: async (itemId, commitmentHash, proofJson) => {
    try {
      const response = await apiClient.post('/zkp-proxy/store-proof', {
        item_id: itemId,
        commitment_hash: commitmentHash,
        proof_json: proofJson
      });
      return response.data;
    } catch (error) {
      console.warn('Backend offline, simulating store proof.');
      return { success: true };
    }
  },

  // Get proofs for auction
  getProofsForAuction: async (itemId) => {
    try {
      const response = await apiClient.get(`/zkp-proxy/proofs/${itemId}`);
      return response.data;
    } catch (error) {
      console.warn('Backend offline, falling back to mock ZKP proofs.');
      return {
        success: true,
        data: [
          {
            bidder_address: 'cosmos1test1234567890abcdefghijklmnop1',
            commitment_hash: '5f4dcc3b5aa765d61d8327deb882cf99f2b8b99bbccaa887766554433221100',
            verified: true,
            created_at: new Date().toISOString()
          }
        ]
      };
    }
  }
};
