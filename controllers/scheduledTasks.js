import cron from 'node-cron';
import BoringComapny from '../models/trackingModel.js';
import Status from '../models/statusModel.js';

// Status progression order
const STATUS_FLOW = [
  'Ordered',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

// Convert interval string to milliseconds
const getIntervalInMs = (interval) => {
  switch(interval) {
    case 'auto':
      return 30 * 1000; // 30 seconds
    case '5hours':
      return 5 * 60 * 60 * 1000;
    case '10hours':
      return 10 * 60 * 60 * 1000;
    case '1day':
      return 24 * 60 * 60 * 1000;
    case '3days':
      return 3 * 24 * 60 * 60 * 1000;
    case '4days':
      return 4 * 24 * 60 * 60 * 1000;
    case 'manual':
      return null; // No automatic updates
    default:
      return 24 * 60 * 60 * 1000; // Default to 1 day
  }
};

// Main function to check and update statuses
const checkAndUpdateStatuses = async () => {
  console.log('Running automatic status update check...');
  try {
    const now = new Date();
    
    // Find all non-delivered and non-cancelled orders
    const activeTrackings = await BoringComapny.find({
      currentStatus: { $nin: ['Delivered', 'Cancelled'] }
    });

    console.log(`Found ${activeTrackings.length} active trackings to check`);

    for (const tracking of activeTrackings) {
      // Skip if manual updates only
      const interval = tracking.additionalDetails?.statusUpdateInterval || '1day';
      if (interval === 'manual') {
        console.log(`Skipping ${tracking.trackingNumber} - manual mode`);
        continue;
      }

      const intervalMs = getIntervalInMs(interval);
      if (!intervalMs) continue;

      // Get current status index
      const currentIndex = STATUS_FLOW.indexOf(tracking.currentStatus);
      if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
        continue; // Invalid status or already at final status
      }

      // Find the MOST RECENT status update (whether manual or automatic)
      const lastUpdate = await Status.findOne({
        trackingId: tracking._id
      }).sort({ timestamp: -1 });

      // Use the last update time OR order date if no updates yet
      const lastUpdateDate = lastUpdate ? lastUpdate.timestamp : tracking.orderDate;
      const timeSinceLastUpdate = now - lastUpdateDate;

      console.log(`Checking ${tracking.trackingNumber}: Current=${tracking.currentStatus}, Interval=${interval}, Time since update=${Math.floor(timeSinceLastUpdate/1000)}s`);

      // Check if enough time has passed based on the interval
      if (timeSinceLastUpdate >= intervalMs) {
        const nextStatus = STATUS_FLOW[currentIndex + 1];
        
        // Update tracking
        tracking.currentStatus = nextStatus;
        await tracking.save();

        // Create status history
        await Status.create({
          trackingId: tracking._id,
          status: nextStatus,
          notes: '',
          timestamp: now
        });

        console.log(`✅ Auto-updated ${tracking.trackingNumber} from ${STATUS_FLOW[currentIndex]} to ${nextStatus}`);
      }

      // Auto-mark as delivered if past expected delivery date
      if (tracking.expectedDeliveryDate && now >= tracking.expectedDeliveryDate) {
        if (tracking.currentStatus !== 'Delivered' && tracking.currentStatus !== 'Cancelled') {
          tracking.currentStatus = 'Delivered';
          await tracking.save();

          await Status.create({
            trackingId: tracking._id,
            status: 'Delivered',
            notes: 'Automatically marked as delivered on expected date',
            timestamp: now
          });

          console.log(`✅ Auto-delivered ${tracking.trackingNumber} (reached expected delivery date)`);
        }
      }
    }

    console.log('Automatic status update completed');
  } catch (error) {
    console.error('Error in automatic status update:', error);
  }
};

// Start the scheduler
export const startStatusScheduler = () => {
  // Run every minute to handle all intervals (especially the 30-second auto mode)
  cron.schedule('*/1 * * * *', checkAndUpdateStatuses);
  
  console.log('✅ Status scheduler started - runs every minute');
  
  // Run immediately on startup to check existing orders
  checkAndUpdateStatuses();
};