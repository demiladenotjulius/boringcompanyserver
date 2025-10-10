import express from 'express';
import { loginAdmin, getAdminProfile, changePassword, registerInitialAdmin} from '../controllers/adminControllers.js';
import { authenticateAdmin } from '../middlewares/admin-middleware.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post('/login', loginAdmin);

// Protected routes (require admin authentication)
adminRouter.get('/profile', authenticateAdmin, getAdminProfile);
adminRouter.post('/change-password', authenticateAdmin, changePassword);
adminRouter.post('/setup', registerInitialAdmin);

export default adminRouter;