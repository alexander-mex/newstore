const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    images: [String],
    name: {
      uk: { type: String, required: true },
      en: { type: String, required: true }
    },
    description: {
      uk: String,
      en: String
    },
    detailedDescription: {
      uk: String,
      en: String
    },
    oldPrice: Number,
    newPrice: {
      type: Number,
      required: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: [{
      _id: mongoose.Schema.Types.ObjectId,
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userName: { type: String, required: true },
      text: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: function(v) {
            return v.trim().length > 0;
          },
          message: 'Review text cannot be empty'
        }
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: Date
    }],
    category: {
      type: String,
      enum: ['accessories', 'footwear', 'clothing', 'bags'],
      required: true
    },
    subcategory: {
      uk: String,
      en: String,
      category: String
    },
    accessoriesType: {
      type: String,
      default: null
    },
    footwearType: {
      type: String,
      default: null
    },
    clothingType: {
      type: String,
      default: null
    },
    season: {
      type: String,
      enum: ['winter', 'summer', 'demiseason', 'allseason'],
      default: 'demiseason'
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex', 'kids'],
      default: 'unisex'
    },
    sizes: {
      type: String,
      default: ""
    },
    colors: {
      uk: { type: String, default: "" },
      en: { type: String, default: "" }
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    features: {
      material: {
        uk: String,
        en: String
      },
      waterproof: Boolean,
      warranty: Number,
      isNewPrice: {
        type: Boolean,
        default: false
      },
      isSale: {
        type: Boolean,
        default: false
      }
    },
    countryOfOrigin: {
      uk: String,
      en: String
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false,
    suppressReservedKeysWarning: true // ДОДАНО для подавлення попереджень
  }
);

// Оновлені pre-save hooks
productSchema.pre('save', function (next) {
  this.reviews = this.reviews.filter(review => 
    review && 
    review.userId && 
    mongoose.Types.ObjectId.isValid(review.userId) &&
    review.userName && 
    review.text && 
    review.text.trim().length > 0 && 
    review.rating >= 1 && 
    review.rating <= 5
  );
  next();
});

productSchema.pre('save', function(next) {
  if (this.oldPrice && this.oldPrice > 0) {
    if (!this.features) this.features = {};
    this.features.isSale = true;
  } else {
    if (!this.features) this.features = {};
    this.features.isSale = false;
  }
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const oldPrice = update.$set?.oldPrice ?? update.oldPrice;
  
  if (!update.$set) update.$set = {};
  if (!update.$set.features) update.$set.features = {};
  
  if (oldPrice !== undefined) {
    update.$set.features.isSale = oldPrice > 0;
  }
  
  if (update.$set.features.isNewPrice !== undefined) {
    update.$set.features.isNewPrice = Boolean(update.$set.features.isNewPrice);
  }
  
  next();
});

module.exports = mongoose.model("Product", productSchema);