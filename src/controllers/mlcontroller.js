import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';

export async function generateImage(req, res) {
  try {
    const { user_theme, genre, style, dont_include } = req.body;
    
    // Input validation
    if (!user_theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    const uuid = uuidv4();
    
    const response = await axios.post(process.env.ML_PIPELINE_URL, {
      user_theme,
      genre: genre || '',
      style: style || '',
      dont_include: dont_include || '',
      uuid: uuid
    });

    if (!response.data.image_url) {
      throw new Error('No image URL received from ML pipeline');
    }

    // If user is authenticated (optional), save the image URL
    if (req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        console.log('Saving image URL:', response.data.image_url, 'for user:', userId);
        
        await pool.execute(
          'UPDATE users SET image_urls = CONCAT(COALESCE(image_urls, ""), IF(image_urls IS NULL OR image_urls = "", "", ","), ?) WHERE id = ?',
          [response.data.image_url, userId]
        );
      } catch (dbError) {
        console.error('Error saving image URL:', dbError);
       
      }
    }
    
    return res.json({
      status: response.data.status,
      message: response.data.message,
      uuid: response.data.uuid,
      image_url: response.data.image_url
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing image',
      message: error.message
    });
  }
}