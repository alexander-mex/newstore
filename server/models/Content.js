// server/models/Content.js
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  title: {
    uk: String,
    en: String
  },
  description: {
    uk: String,
    en: String
  },
  image: String,
  link: { type: String, default: "" },
  category: {
    type: String,
    enum: ['accessories', 'footwear', 'clothing', 'bags']
  }
});

const moduleCardSchema = new mongoose.Schema({
  id: Number,
  imgSrc: String,
  title: {
    uk: String,
    en: String
  },
  description: {
    uk: String,
    en: String
  },
  newPrice: {
    uk: String,
    en: String
  },
  oldPrice: {
    uk: String,
    en: String
  },
  link: { type: String, default: "" },
  isNewPrice: Boolean,
  isSale: Boolean
});

const contentSchema = new mongoose.Schema({
  cards: [cardSchema],
  moduleCards: [moduleCardSchema] // Added moduleCardSchema as a field
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Content', contentSchema);