import { Strategy } from 'passport-google-oauth20';
import passport from 'passport';
import { pool } from '../config/db.js';

export default passport.use(
    new Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
            ? 'https://api.sohankumar.com/auth/google/redirect'
            :   'http://localhost:3000/auth/google/redirect',
        scope: ['profile', 'email']
    }, async (access_token, refresh_token, profile, done) => {
        try {
            // First check if user exists using email
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [profile.emails[0].value]
            );

            if (rows.length > 0) {
                return done(null, rows[0]);
            }

            // If user doesn't exist, create new userne
            const [result] = await pool.execute(
                'INSERT INTO users (username, email) VALUES (?, ?)',
                [profile.displayName, profile.emails[0].value]
            );
            
            if (result.insertId) {
                return done(null, { 
                    id: result.insertId,
                    email: profile.emails[0].value,
                    username: profile.displayName 
                });
            }
            
        } catch (error) {
            console.error('Error during authentication:', error);
            return done(error, null);
        }
    })
);

// Add serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return done(null, false);
        }
        done(null, rows[0]);
    } catch (error) {
        done(error, null);
    }
});
