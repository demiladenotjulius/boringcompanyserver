import mongoose from "mongoose";

const createStatusSchema = new mongoose.Schema({
    trackingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tracking',
        required: true
      },
      
      // Basic status of the order/product
      status: {
        type: String,
        required: true,
        enum: ['Ordered', 'Processing', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Ordered'
      },
      
      // Timestamp of this status update
      timestamp: {
        type: Date,
        default: Date.now,
        required: true
      },
      
      // Additional information about this update (optional)
      notes: {
        type: String,
        trim: true
      },
      
      // Who made this update (admin reference)
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }
    }, {
      timestamps: true
    });

      // Add any methods if needed
      createStatusSchema.methods.formatForCustomer = function() {
        return {
          status: this.status,
          timestamp: this.timestamp,
          notes: this.notes
        };}
    


const Status = mongoose.model('statusModel', createStatusSchema)
export default Status
