// src/components/Cart.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Modal, Button, ListGroup, Badge, Form } from 'react-bootstrap';
import '../App.css';

// Створюємо контекст
const CartContext = createContext();

export const CartProvider = ({ children, darkMode, language }) => {
  const [showCart, setShowCart] = useState(false);
  const [total, setTotal] = useState(0);

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.newPrice * item.quantity), 0);
    setTotal(sum);
  };

  // Завантаження кошика з localStorage
  const [cartItems, setCartItems] = useState(() => {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const parsedData = JSON.parse(cartData);
        if (parsedData.items && parsedData.expires) {
          if (new Date().getTime() < parsedData.expires) {
            return parsedData.items;
          } else {
            localStorage.removeItem('cart');
          }
        }
      } catch (error) {
        console.error('Помилка при парсингу даних кошика:', error);
        localStorage.removeItem('cart');
      }
    }
    return [];
  });

  useEffect(() => {
    calculateTotal(cartItems);
  }, [cartItems]);

  // Збереження кошика в localStorage
  useEffect(() => {
    if (cartItems.length > 0) {
      const expires = new Date().getTime() + 72 * 60 * 60 * 1000; // 72 години
      localStorage.setItem('cart', JSON.stringify({ items: cartItems, expires }));
    } else {
      localStorage.removeItem('cart');
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      let updatedItems;
      
      if (existingItem) {
        updatedItems = prevItems.map(item =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedItems = [...prevItems, { ...product, quantity: 1 }];
      }
      
      calculateTotal(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => item._id !== productId);
      calculateTotal(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item._id === productId ? { ...item, quantity: newQuantity } : item
      );
      calculateTotal(updatedItems);
      return updatedItems;
    });
  };

  const getLocalizedText = (textObj) => {
    if (!textObj) return "";
    if (typeof textObj === 'string') return textObj;
    return textObj[language] || textObj.uk || textObj.en || "";
  };

  const getText = (ukText, enText) => (language === 'uk' ? ukText : enText);

  const cartContextValue = {
    addToCart,
    cartItems,
    removeFromCart,
    updateQuantity,
    total,
    CartComponent: (
      <>
        <Button 
          variant={darkMode ? "outline-light" : "outline-dark"} 
          onClick={() => setShowCart(true)}
          className="cart-button"
        >
          <i className="bi bi-cart"></i>
          {cartItems.length > 0 && (
            <Badge bg="danger" className="cart-badge">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </Badge>
          )}
        </Button>

        <Modal
          show={showCart}
          onHide={() => setShowCart(false)}
          centered
          size="lg"
          className={`cart-modal ${darkMode ? 'dark-theme' : ''}`}
        >
          <Modal.Header closeButton className={darkMode ? 'modal-header-dark' : ''}>
            <Modal.Title>{getText('Кошик', 'Shopping Cart')}</Modal.Title>
          </Modal.Header>
          <Modal.Body className={`cart-body ${darkMode ? 'bg-dark' : 'bg-light'}`}>
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <i className="bi bi-cart-x"></i>
                <p>{getText('Ваш кошик порожній', 'Your cart is empty')}</p>
              </div>
            ) : (
              <>
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <ListGroup.Item key={item._id} className="cart-item">
                      <div className="cart-item-image">
                        <img 
                          src={item.images?.[0] ? `http://localhost:5000${item.images[0]}` : '/placeholder-product.jpg'} 
                          alt={item.name} 
                        />
                      </div>
                      <div className="cart-item-name">{getLocalizedText(item.name)}</div>
                      <div className="cart-item-price">
                        {item.oldPrice && (
                          <span className="old-price">{item.oldPrice} ₴</span>
                        )}
                        <span className="new-price">{item.newPrice} ₴</span>
                      </div>
                      <div className="cart-item-quantity">
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                          className="quantity-input"
                        />
                      </div>
                      <div className="cart-item-remove">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                
                <div className="cart-summary">
                  <h4>{getText('Разом', 'Total')}: {total.toFixed(2)} ₴</h4>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (cartItems.length > 0) {
                        setShowCart(false);
                        window.location.href = '/checkout';
                      }
                    }}
                    className="checkout-button"
                  >
                    {getText('Оформити замовлення', 'Checkout')}
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      </>
    )
  };

  return (
    <CartContext.Provider value={cartContextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};