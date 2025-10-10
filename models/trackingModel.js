import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productDescription: {
    type: String,
    trim: true
  },
  currentStatus: {
    type: String,
    enum: ['Ordered', 'Processing', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Ordered'
  },
  
  // SHIPPING LOCATIONS
  pickupLocation: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  deliveryLocation: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  expectedDeliveryDate: {
    type: Date
  },
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  additionalDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

trackingSchema.index({ trackingNumber: 1 });

trackingSchema.methods.updateStatus = function(newStatus, notes, adminId) {
  this.currentStatus = newStatus;
  return this.save();
};

trackingSchema.statics.generateTrackingNumber = async function() {
  const prefix = "TRK";
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const trackingNumber = `${prefix}${randomPart}`;
  
  const exists = await this.findOne({ trackingNumber });
  if (exists) {
    return this.generateTrackingNumber();
  }
  return trackingNumber;
};

const BoringComapny = mongoose.model('BoringComapny', trackingSchema);
export default BoringComapny;