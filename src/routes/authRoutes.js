import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();

// Auth status endpoint
router.get('/status', (req, res) => {
  try {
    res.json({ 
      isAuthenticated: !!(req.user || req.session.userId),
      user: req.user || null
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
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000' }),
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
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Redirect to frontend
    res.redirect('http://localhost:3000');
  }
);

export default router;