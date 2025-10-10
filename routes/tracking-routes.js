import express from 'express';

import { 
  createTracking, 
  getAllTrackings, 
  getTrackingById, 
  updateStatus, 
  getTrackingByNumber,
  getShippingLabel,
  cancelOrder, 
  reactivateOrder,
  sendCustomEmail,
  submitContactForm
} from '../controllers/trackingController.js';
import { authenticateAdmin } from '../middlewares/admin-middleware.js';

const trackingRouter = express.Router();

// Admin routes (protected)
trackingRouter.post('/create', authenticateAdmin, createTracking);
trackingRouter.get('/all', authenticateAdmin, getAllTrackings);
trackingRouter.get('/admin/:id', authenticateAdmin, getTrackingById);
trackingRouter.put('/:id/status', authenticateAdmin, updateStatus);
trackingRouter.put('/:id/cancel', authenticateAdmin, cancelOrder); 
trackingRouter.put('/:id/reactivate', authenticateAdmin, reactivateOrder);  
// Public routes - no authentication needed
trackingRouter.get('/track/:trackingNumber', getTrackingByNumber);
trackingRouter.get('/label/:trackingNumber', getShippingLabel);
trackingRouter.post('/send-email', authenticateAdmin, sendCustomEmail);
trackingRouter.post('/contact', submitContactForm);


export default trackingRouter;