export const validateImageRequest = (req, res, next) => {
  const { user_theme, genre, style, dont_include } = req.body;
  
  if (!user_theme || typeof user_theme !== 'string') {
    return res.status(400).json({ error: 'Valid theme is required' });
  }

  if (user_theme.length > 300) {
    return res.status(400).json({ error: 'Theme too long' });
  }

  // Sanitize inputs
  req.body.user_theme = user_theme.trim();
  req.body.genre = genre?.trim() || '';
  req.body.style = style?.trim() || '';
  req.body.dont_include = dont_include?.trim() || '';

  next();
}; 