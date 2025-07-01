import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();

// Auth status endpoint
router.get('/status', (req, res) => {
  try {
    let user = null;
    let isAuthenticated = false;

    // Check for JWT token in cookies
    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = decoded;
        isAuthenticated = true;
      } catch (err) {
        isAuthenticated = false;
      }
    }

    res.json({
      isAuthenticated,
      user
    });
  } catch (error) {
    res.status(500).json({
      error: 'Auth status check failed',
      message: error.message
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ 
          error: 'Logout failed', 
          message: err.message 
        });
      }
      
      res.clearCookie('token');
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            error: 'Session clearing out failed', 
            message: err.message 
          });
        }
        res.json({ 
          success: true, 
          message: 'Logged out successfully' 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Logout failed', 
      message: error.message 
    });
  }
});

// Google authentication routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'consent'
}));

router.get('/google/redirect', 
  passport.authenticate('google', { 
    failureRedirect: process.env.NODE_ENV === 'production' 
      ? 'https://sohankumar.com' 
      : 'http://localhost:3000' 
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
      
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? '.sohankumar.com' : undefined,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to frontend
    res.redirect(process.env.NODE_ENV === 'production'
      ? 'https://sohankumar.com'
      : 'http://localhost:3000'
    );
  }
);

export default router;