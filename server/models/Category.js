// server/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    uk: { type: String, required: true },
    en: { type: String, required: true },
  },
  image: { type: String, default: "/placeholder.png" },
  link: { type: String, required: true },
  category: {
    type: String,
    enum: ['accessories', 'footwear', 'clothing', 'bags'],
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Category', categorySchema);