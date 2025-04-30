import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate user via token or session
 * Used for regular user authentication
 */
export const authenticateUser = (req, res, next) => {
  const token = req.cookies.token;
  
  // Check for both token and session
  if (!token && !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } else {
      req.userId = req.session.userId;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * Middleware that requires a valid token
 * Used for payment routes requiring stricter authentication
 */
export const authenticateToken = (req, res, next) => {
  // Check for token in cookies or Authorization header
  let token = req.cookies.token;
  
  // Also check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (headerToken) {
      console.log("Using token from Authorization header");
      token = headerToken;
    }
  }
  
  if (!token) {
    console.log("Payment auth failed: No token provided in cookies or headers");
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    
    // Check if userId exists in the token (allow userId: 0 as valid)
    if (decoded.userId === undefined || decoded.userId === null) {
      console.log("Payment auth failed: No userId in token");
      return res.status(401).json({ error: "Invalid token format" });
    }
    
    // Set both user and userId properties for compatibility
    req.user = { 
      ...decoded,
      id: decoded.userId // Add id property based on userId for compatibility
    };
    req.userId = decoded.userId;
    
    console.log("Authentication successful for userId:", req.userId);
    next();
  } catch (error) {
    console.log("Payment auth failed: Token verification error", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
