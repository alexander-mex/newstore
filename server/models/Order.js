// server/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null для неавторизованих користувачів
  },
  
  // Дані замовлення
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Особисті дані замовника
  customerInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    postService: {
      type: String,
      required: true,
      enum: ['ukrposhta', 'novaposhta']
    },
    postOffice: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Товари в замовленні
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    images: [String],
    newPrice: {
      type: Number,
      required: true
    },
    oldPrice: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  
  // Фінансова інформація
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Статус замовлення
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Дати
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Генерація номера замовлення
orderSchema.pre('save', async function(next) {
  if (this.isNewPrice) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);