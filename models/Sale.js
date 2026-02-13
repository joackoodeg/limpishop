import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  size: {
    type: Number,
    required: true
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  items: [saleItemSchema],
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['efectivo', 'tarjeta', 'transferencia']
  },
  date: {
    type: Date,
    default: Date.now
  },
  
  // Legacy fields for single-product sales (for backward compatibility)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productName: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    default: null
  },
  quantity: {
    type: Number,
    default: null
  },
  size: {
    type: String,
    default: null
  },
  total: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
saleSchema.index({ date: -1 });
saleSchema.index({ paymentMethod: 1 });

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;