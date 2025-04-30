import { Router } from 'express';
import { pool } from '../config/db.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/user/images', authenticateUser, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT image_urls FROM users WHERE id = ?",
      [req.userId]
    );

    if (!users || !users[0] || !users[0].image_urls) {
      return res.json({ success: true, images: [] });
    }

    // Split the comma-separated URLs into an array
    const images = users[0].image_urls.split(',')
      .filter(Boolean)  // Remove empty strings
      .map(url => ({
        image_url: url.trim(),
        created_at: new Date()
      }));

    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

export default router; 