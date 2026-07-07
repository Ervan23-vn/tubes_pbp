import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Upload Controller
 * Handle image uploads for auction items and profile pictures
 */

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,webp').split(',');

export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { file } = req;
    const { purpose = 'auction' } = req.body; // 'auction' or 'profile'

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
      });
    }

    // Create uploads directory if not exists
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (err) {
      console.log('Uploads directory already exists or error:', err.message);
    }

    // Generate unique filename
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, purpose, filename);
    const dirpath = path.join(UPLOADS_DIR, purpose);

    // Create purpose subdirectory
    try {
      await fs.mkdir(dirpath, { recursive: true });
    } catch (err) {
      console.log('Purpose directory error:', err.message);
    }

    // Save file
    await fs.writeFile(filepath, file.buffer);

    // Generate URL
    const fileUrl = `/uploads/${purpose}/${filename}`;
    const thumbnailUrl = ext === 'png' || ext === 'jpg' ? `/uploads/${purpose}/thumb_${filename}` : fileUrl;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename,
        url: fileUrl,
        thumbnail_url: thumbnailUrl,
        size: file.size,
        mime_type: file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
      stack: error.stack
    });
  }
}

export async function getUploadedImage(req, res) {
  try {
    const { purpose, filename } = req.params;

    const filepath = path.join(UPLOADS_DIR, purpose, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(filepath);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve image',
      error: error.message,
      stack: error.stack
    });
  }
}
