import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

// reminder to remove this from the codebase
// currentyl not being used but tried to implement in initial versions

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:8000/auth/google/redirect' 
);

export async function initiateGoogleAuth(req, res) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(authUrl);
}

export async function handleGoogleCallback(req, res) {
  try {
    const { code } = req.query;
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name } = ticket.getPayload();

    // Check if user exists, if not create new user
    let [users] = await query("SELECT * FROM users WHERE email = ?", [email]);
    let userId;

    if (users.length === 0) {
      const result = await query(
        "INSERT INTO users (username, email) VALUES (?, ?)",
        [name, email]
      );
      userId = result.insertId;
    } else {
      userId = users[0].id;
    }

    // Create JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    
    // Set cookie and session
    req.session.userId = userId;
    res.cookie("token", token, { httpOnly: true });
    
    res.redirect('/'); // Redirect to home page after successful login
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
