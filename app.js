import express, { json, response } from 'express';
import cors from 'cors';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import router from './src/routes/mlroutes.js';
import passport from 'passport';
import googleStrategy from './src/strategy/google-strategy.js';
import jwt from 'jsonwebtoken';
import userRoutes from './src/routes/userRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import { pool } from './src/config/db.js';

dotenv.config();

// The database configuration has been moved to src/config/db.js

(async () => { // testing database connection
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to AWS RDS MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
})();

const app = express();

// Create MySQL Session Store
const MySQLStoreSession = MySQLStore(session);

// Session store configuration
const sessionStore = new MySQLStoreSession({
  createDatabaseTable: true,    // Automatically create sessions table
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  },
  expiration: 24 * 60 * 60 * 1000,  // Session expiration (24 hours)
  debug: true  // Enable debug logging
}, pool);

// Add session store error handling
sessionStore.on('error', (error) => {
  console.error('Session Store Error:', error);
});

// Add passport serialize/deserialize before routes
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Update CORS settings
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://sohankumar.com'
    :   'http://localhost:3000', 
  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(cookieParser());
app.use(session({
  store: sessionStore,  // Use MySQL session store
  name: 'sessionId', // Add explicit cookie name
  secret: process.env.SESSION_SECRET || "sohan the developer",
  resave: false,
  saveUninitialized: true, // Changed to true to debug session creation
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // age of cookie
    sameSite: 'lax'
  }
}));

// Add session debugging middleware
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session Data:', req.session);
  console.log('Is Session New?:', req.session.isNew);
  next();
});

app.use(passport.initialize());
app.use(passport.session());

// Use the auth routes
app.use('/auth', authRoutes);

// Add error handling middleware at the top
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.use(router);

// Add test endpoint for session verification
app.get('/test-session', (req, res) => {
  // Set some session data
  req.session.testData = 'test value';
  req.session.views = (req.session.views || 0) + 1;
  
  // Force session save
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Failed to save session' });
    }
    res.json({ 
      sessionId: req.sessionID,
      sessionData: req.session,
      views: req.session.views
    });
  });
});

app.use(userRoutes);
app.use('/payments', paymentRoutes);

// Add health check endpoint for AWS
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Export the listen function for server.js
export const listen = (port, callback) => {
  app.listen(port, callback);
};

const startServer = async () => {
  let port = process.env.PORT || 8000;
  let maxAttempts = 5;
  let attempts = 0;

  const tryListen = (portToTry) => {
    return new Promise((resolve, reject) => {
      const server = app.listen(portToTry)
        .on('listening', () => {
          console.log(`Server running in ${process.env.NODE_ENV} mode on port ${portToTry}`);
          resolve(server);
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            reject(err);
          }
        });
    });
  };

  while (attempts < maxAttempts) {
    try {
      await tryListen(port);
      break;
    } catch (error) {
      attempts++;
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      port++;
    }
  }
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { pool };
export default app;