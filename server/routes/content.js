// routes/content.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Content = require('../models/Content');
const User = require('../models/User');

// Модель для карток ModuleSlider
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
  isNewPrice: Boolean,
  isSale: Boolean,
  link: String // Додано поле link
});

const ModuleContent = mongoose.model('ModuleContent', new mongoose.Schema({
  cards: [moduleCardSchema]
}, {
  timestamps: true
}));

// Отримати картки HomePage
router.get("/cards", async (req, res) => {
  try {
    const content = await Content.findOne();
    res.json(content || { cards: [] });
  } catch (err) {
    console.error("Error fetching content cards:", err);
    res.status(500).json({ message: "Failed to fetch cards", error: err.message });
  }
});

// Оновити картки HomePage
router.put('/cards', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    console.log('Request body:', req.body); // Додано логування

    let content = await Content.findOne();
    if (!content) {
      content = new Content({ cards: req.body.cards });
    } else {
      content.cards = req.body.cards.map(card => ({
        ...card,
        link: card.link || '', // Гарантуємо, що link завжди є
        category: ['accessories', 'footwear', 'clothing', 'bags'].includes(card.category) ? card.category : undefined
      }));
    }

    console.log('Cards to be saved:', content.cards); // Додано логування
    await content.save();
    res.json({ message: 'Cards updated successfully' });
  } catch (error) {
    console.error('Error updating cards:', error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати картки ModuleSlider
router.get('/module-cards', async (req, res) => {
  try {
    const content = await ModuleContent.findOne();
    res.json({ cards: content?.cards || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Оновити картки ModuleSlider
router.put('/module-cards', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    console.log('Request body for module cards:', req.body); // Додано логування

    let content = await ModuleContent.findOne();
    if (!content) {
      content = new ModuleContent({ cards: req.body.cards });
    } else {
      content.cards = req.body.cards.map(card => ({
        ...card,
        link: card.link || '', // Гарантуємо, що link завжди є
        category: ['accessories', 'footwear', 'clothing', 'bags'].includes(card.category) ? card.category : undefined
      }));
    }

    console.log('Module cards to be saved:', content.cards); // Додано логування
    await content.save();
    res.json({ message: 'Module cards updated successfully' });
  } catch (error) {
    console.error('Error updating module cards:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;