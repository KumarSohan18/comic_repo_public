import { listen } from './app.js';
const PORT = process.env.PORT || 5000;

listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});