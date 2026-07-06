import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { auctionsAPI, uploadAPI, getImageUrl } from '../utils/api';

/**
 * Create Auction Page
 * Form untuk membuat lelang baru
 */

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'antiques',
    starting_price: '',
    start_time: '',
    end_time: '',
    image_url: '',
    thumbnail_url: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Submit to backend
      const result = await auctionsAPI.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Buat Lelang Baru</h1>

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
            placeholder="Contoh: Antique Ming Vase"
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
            placeholder="Deskripsikan barang yang akan dilelang..."
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Kategori
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="antiques">Antik</option>
            <option value="art">Seni</option>
            <option value="jewelry">Perhiasan</option>
            <option value="collectibles">Koleksi</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Foto Lelang * (JPG, PNG, WebP, max 5MB)
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
                className="w-20 h-20 rounded object-cover"
              />
            )}
          </div>
        </div>

        {/* Harga Mulai */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Harga Mulai * (STAKE)
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
              Kategori Harga
            </label>
            <input
              type="text"
              value={formData.category}
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
              '✓ Buat Lelang'
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
