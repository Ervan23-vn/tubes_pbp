import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { auctionsAPI, uploadAPI, getImageUrl } from '../utils/api';

/**
 * Create Auction Page — Fokus Barang Elektronik IT
 * Form untuk membuat lelang Hardware & Software
 */

// Fallback categories if API is unavailable
const FALLBACK_CATEGORIES = {
  hardware: {
    label: 'Hardware',
    subcategories: {
      'hw-pc-component': { label: 'PC Components', icon: 'memory' },
      'hw-laptop-desktop': { label: 'Laptop & Desktop', icon: 'laptop_mac' },
      'hw-networking': { label: 'Networking Equipment', icon: 'router' },
      'hw-storage': { label: 'Storage & Memory', icon: 'storage' },
      'hw-peripheral': { label: 'Peripherals & Accessories', icon: 'keyboard' },
      'hw-server': { label: 'Server & Enterprise', icon: 'dns' },
    }
  },
  software: {
    label: 'Software',
    subcategories: {
      'sw-os': { label: 'Operating System', icon: 'terminal' },
      'sw-devtools': { label: 'Development Tools', icon: 'code' },
      'sw-productivity': { label: 'Productivity Suite', icon: 'edit_document' },
      'sw-cloud': { label: 'Cloud & SaaS License', icon: 'cloud' },
      'sw-game-media': { label: 'Game & Multimedia', icon: 'sports_esports' },
      'sw-security': { label: 'Security & Utility', icon: 'shield' },
    }
  }
};

const FALLBACK_CONDITIONS = [
  { value: 'new', label: 'Baru / Sealed' },
  { value: 'like_new', label: 'Bekas - Like New' },
  { value: 'good', label: 'Bekas - Baik' },
  { value: 'refurbished', label: 'Refurbished' },
];

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [conditions, setConditions] = useState(FALLBACK_CONDITIONS);

  // Specification rows
  const [specRows, setSpecRows] = useState([{ key: '', value: '' }]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    main_category: 'hardware',
    sub_category: 'hw-pc-component',
    item_condition: 'new',
    brand: '',
    warranty_info: '',
    starting_price: '',
    start_time: '',
    end_time: '',
    image_url: '',
    thumbnail_url: ''
  });

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories);
          setConditions(data.data.conditions);
        }
      } catch (err) {
        console.warn('Using fallback categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-select first subcategory when main_category changes
    if (name === 'main_category') {
      const firstSub = Object.keys(categories[value]?.subcategories || {})[0];
      setFormData(prev => ({
        ...prev,
        main_category: value,
        sub_category: firstSub || ''
      }));
    }
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...specRows];
    updated[index][field] = value;
    setSpecRows(updated);
  };

  const addSpecRow = () => {
    setSpecRows(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecRow = (index) => {
    setSpecRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const result = await uploadAPI.uploadImage(file, 'auction');
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          image_url: result.data.url,
          thumbnail_url: result.data.thumbnail_url
        }));
        setImagePreview(result.data.url);
        setSuccess('Gambar berhasil diupload');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!formData.title || !formData.starting_price || !formData.start_time || !formData.end_time) {
        throw new Error('Harap isi semua field yang required');
      }

      if (!formData.image_url) {
        throw new Error('Harap upload gambar lelang');
      }

      // Check time validity
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      if (endTime <= startTime) {
        throw new Error('Waktu berakhir harus setelah waktu mulai');
      }

      // Build specifications JSON from rows
      const specifications = {};
      specRows.forEach(row => {
        if (row.key.trim() && row.value.trim()) {
          specifications[row.key.trim()] = row.value.trim();
        }
      });

      // Submit to backend
      const result = await auctionsAPI.create({
        title: formData.title,
        description: formData.description,
        main_category: formData.main_category,
        sub_category: formData.sub_category,
        item_condition: formData.item_condition,
        brand: formData.brand,
        specifications: JSON.stringify(specifications),
        warranty_info: formData.warranty_info,
        starting_price: formData.starting_price,
        start_time: formData.start_time,
        end_time: formData.end_time,
        image_url: formData.image_url,
        thumbnail_url: formData.thumbnail_url
      });

      if (result.success) {
        setSuccess('Lelang berhasil dibuat!');
        setTimeout(() => {
          navigate(`/auctions/${result.data.item_id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Gagal membuat lelang');
    } finally {
      setLoading(false);
    }
  };

  // Get current subcategories based on selected main_category
  const currentSubcategories = categories[formData.main_category]?.subcategories || {};

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Buat Lelang Baru</h1>
      <p className="text-gray-500 text-sm mb-6">Lelang barang elektronik bidang IT — Hardware & Software</p>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="text-red-600 mt-0.5" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">✓ {success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
        
        {/* Section: Informasi Dasar */}
        <div className="border-b border-gray-100 pb-2 mb-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="text-blue-600">📋</span> Informasi Dasar
          </h2>
        </div>

        {/* Judul */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Judul Lelang *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Contoh: NVIDIA RTX 4090 24GB GDDR6X"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            required
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Deskripsikan barang yang akan dilelang (kondisi, kelengkapan, dll)..."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Section: Kategori & Kondisi */}
        <div className="border-b border-gray-100 pb-2 mb-4 pt-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="text-blue-600">🏷️</span> Kategori & Kondisi Barang
          </h2>
        </div>

        {/* Main Category + Sub Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jenis Barang *
            </label>
            <select
              name="main_category"
              value={formData.main_category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {key === 'hardware' ? '🔧' : '💿'} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sub-Kategori *
            </label>
            <select
              name="sub_category"
              value={formData.sub_category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              {Object.entries(currentSubcategories).map(([key, sub]) => (
                <option key={key} value={key}>{sub.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition + Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kondisi Barang *
            </label>
            <select
              name="item_condition"
              value={formData.item_condition}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              {conditions.map((cond) => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand / Merek
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="Contoh: NVIDIA, Intel, Microsoft"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Warranty */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Informasi Garansi
          </label>
          <input
            type="text"
            name="warranty_info"
            value={formData.warranty_info}
            onChange={handleInputChange}
            placeholder="Contoh: Garansi Resmi 3 Tahun"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Section: Spesifikasi Teknis */}
        <div className="border-b border-gray-100 pb-2 mb-4 pt-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="text-blue-600">📊</span> Spesifikasi Teknis
          </h2>
          <p className="text-xs text-gray-400 mt-1">Tambahkan spesifikasi teknis dalam bentuk key-value</p>
        </div>

        <div className="space-y-2">
          {specRows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={row.key}
                onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                placeholder="Nama (misal: VRAM)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <span className="text-gray-400">:</span>
              <input
                type="text"
                value={row.value}
                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                placeholder="Nilai (misal: 24GB GDDR6X)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              {specRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSpecRow(index)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold px-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSpecRow}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 mt-1"
          >
            + Tambah Spesifikasi
          </button>
        </div>

        {/* Section: Foto & Harga */}
        <div className="border-b border-gray-100 pb-2 mb-4 pt-4">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="text-blue-600">💰</span> Foto & Harga Lelang
          </h2>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Foto Barang * (JPG, PNG, WebP, max 5MB)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            {imagePreview && (
              <img
                src={getImageUrl(imagePreview)}
                alt="Preview"
                className="w-20 h-20 rounded object-cover border-2 border-blue-200"
              />
            )}
          </div>
        </div>

        {/* Harga Mulai */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Harga Mulai * (LCT)
            </label>
            <input
              type="number"
              name="starting_price"
              value={formData.starting_price}
              onChange={handleInputChange}
              placeholder="100.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori Dipilih
            </label>
            <input
              type="text"
              value={`${formData.main_category === 'hardware' ? '🔧' : '💿'} ${currentSubcategories[formData.sub_category]?.label || formData.sub_category}`}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Waktu Mulai dan Berakhir */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Waktu Mulai *
            </label>
            <input
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Waktu Berakhir *
            </label>
            <input
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>⚠️ Privacy Note:</strong> Data lelang (judul, deskripsi, harga) disimpan di backend database.
            Bid amount dari peserta disimpan sebagai commitment hash saja, tidak pernah menyimpan bid amount asli di database manapun.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Membuat Lelang...</span>
              </span>
            ) : (
              '✓ Buat Lelang IT'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
