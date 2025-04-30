import { Router } from 'express';
import { generateImage } from '../controllers/mlcontroller.js';
import { validateImageRequest } from '../middleware/validationMiddleware.js';
import { pool } from '../config/db.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', (request, response) => {
    response.status(200).json({ message: 'Welcome to the backend server' });
});

router.post('/generate', 
  validateImageRequest,
  generateImage
);

export default router;