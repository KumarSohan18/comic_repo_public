import { query } from '../config/db';
import axios from 'axios';
import { verify } from 'jsonwebtoken';


//this is file is for future use and is not currently used, tried and tested works ok in initial versions
// reminder to include this file in .gitignore file
// Save image URL to database for logged in user
export const saveImageForUser = async (req, res) => {
  try {
    const { image_url } = req.body;
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!image_url) {
      return res.status(400).json({ error:'Image URL is required' });
    }

    // Verify token and get userId
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Save image URL to database+
    
    await query(
      "INSERT INTO user_images (user_id, image_url, created_at) VALUES (?, ?, NOW())",
      [userId, image_url]
    );

    res.json({ success: true, message: 'Image saved successfully' });

  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ error: 'Failed to save image' });
  }
};

// Get saved images for logged in user
export const getUserImages = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify token and get userId
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get images from the image_urls field
    const [users] = await query(
      "SELECT image_urls FROM users WHERE id = ?",
      [userId]
    );

    if (!users || !users[0] || !users[0].image_urls) {
      return res.json({ success: true, images: [] });
    }

    // Split the comma-separated URLs into an array
    const images = users[0].image_urls.split(',').map(url => ({
      image_url: url.trim(),
      created_at: new Date() // Since we don't store individual timestamps
    }));

    res.json({ success: true, images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};
