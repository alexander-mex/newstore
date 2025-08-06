// server/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware для перевірки токена (опціонально)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Токен невалідний, але це не критично для оформлення замовлення
      req.user = null;
    }
  } else {
    req.user = null;
  }
  
  next();
};

// Створення замовлення
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { customerInfo, items, totalAmount } = req.body;
    
    // Валідація даних
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.status(400).json({ 
        message: 'Необхідні дані: customerInfo, items, totalAmount' 
      });
    }
    
    // Перерахування загальної суми для безпеки
    const calculatedTotal = items.reduce((sum, item) => {
      return sum + (item.newPrice * item.quantity);
    }, 0);
    
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ 
        message: 'Невірна загальна сума замовлення' 
      });
    }
    
    // Додавання subtotal для кожного товару
    const itemsWithSubtotal = items.map(item => ({
      ...item,
      subtotal: item.newPrice * item.quantity
    }));
    
    // Створення замовлення
    const order = new Order({
      userId: req.user?.userId || null,
      customerInfo,
      items: itemsWithSubtotal,
      totalAmount: calculatedTotal
    });
    
    await order.save();
    
    res.status(201).json({
      message: 'Замовлення успішно створено',
      orderNumber: order.orderNumber,
      orderId: order._id
    });
    
  } catch (error) {
    console.error('Помилка при створенні замовлення:', error);
    res.status(500).json({ 
      message: 'Помилка сервера при створенні замовлення' 
    });
  }
});

// Отримання замовлень користувача (тільки для авторизованих)
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Необхідна авторизація' });
    }
    
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name images');
    
    res.json(orders);
    
  } catch (error) {
    console.error('Помилка при отриманні замовлень:', error);
    res.status(500).json({ 
      message: 'Помилка сервера при отриманні замовлень' 
    });
  }
});

// Отримання конкретного замовлення
router.get('/:orderId', optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.productId', 'name images');
    
    if (!order) {
      return res.status(404).json({ message: 'Замовлення не знайдено' });
    }
    
    // Перевірка прав доступу
    if (order.userId && (!req.user || order.userId.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Немає доступу до цього замовлення' });
    }
    
    res.json(order);
    
  } catch (error) {
    console.error('Помилка при отриманні замовлення:', error);
    res.status(500).json({ 
      message: 'Помилка сервера при отриманні замовлення' 
    });
  }
});

module.exports = router;