import { Filter } from "bad-words";

const filter = new Filter();
export const checkBadWords = (req, res, next) => {
  const { user_theme, genre, style, dont_include } = req.body;

  // Check for bad words in the input fields
  for (const field of [user_theme, genre, style, dont_include]) {
    if (field && filter.isProfane(field)) {
      return res.status(400).json({
        success: false,
        error: 'Input contains inappropriate language',
        message: 'Please remove any offensive words from your input.'
      });
    }

  };

  next();
}