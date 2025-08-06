import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from './Cart';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Main.css';

const CheckoutPage = ({ darkMode, language }) => {
  const { isAuthenticated } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    postService: 'novaposhta',
    postOffice: '',
    paymentMethod: 'card'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [total, setTotal] = useState(0);

  // Helper function to get localized text
  const getLocalizedText = (textObj) => {
    if (!textObj) return "";
    if (typeof textObj === 'string') return textObj;
    return textObj[language] || textObj.uk || textObj.en || "";
  };

  const getText = (ukText, enText) => (language === 'uk' ? ukText : enText);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/');
      return;
    }
    
    const calculatedTotal = cartItems.reduce((sum, item) => sum + (item.newPrice * item.quantity), 0);
    setTotal(calculatedTotal);
  }, [cartItems, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          const userData = response.data;
          setFormData(prev => ({
            ...prev,
            firstName: userData.name?.split(' ')[0] || '',
            lastName: userData.name?.split(' ').slice(1).join(' ') || '',
            email: userData.email || '',
            phone: userData.phone || ''
          }));
        } catch (error) {
          console.error('Помилка завантаження даних користувача:', error);
        }
      };
      
      fetchUserData();
    }
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = getText("Ім'я обов'язкове", 'First name is required');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = getText("Прізвище обов'язкове", 'Last name is required');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = getText('Телефон обов\'язковий', 'Phone is required');
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = getText('Невірний формат телефону', 'Invalid phone format');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = getText('Email обов\'язковий', 'Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = getText('Невірний формат email', 'Invalid email format');
    }
    
    if (!formData.city.trim()) {
      newErrors.city = getText('Місто обов\'язкове', 'City is required');
    }
    
    if (!formData.postOffice.trim()) {
      newErrors.postOffice = getText('Відділення обов\'язкове', 'Post office is required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const orderData = {
        customerInfo: formData,
        items: cartItems.map(item => ({
          productId: item._id,
          name: getLocalizedText(item.name),
          images: item.images,
          newPrice: item.newPrice,
          oldPrice: item.oldPrice,
          quantity: item.quantity
        })),
        totalAmount: total
      };
      
      const response = await axios.post('http://localhost:5000/api/orders', orderData, {
        headers: isAuthenticated ? {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        } : {}
      });
      
      setOrderNumber(response.data.orderNumber);
      setOrderSuccess(true);
      
      localStorage.removeItem('cart');
      
      setTimeout(() => {
        navigate('/');
      }, 5000);
      
    } catch (error) {
      console.error('Помилка при створенні замовлення:', error);
      setSubmitError(
        error.response?.data?.message || 
        getText('Помилка при створенні замовлення', 'Error creating order')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToCart = () => {
    navigate('/');
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return null;
  }

  return (
    <div className={`checkout-page ${darkMode ? 'dark-theme' : ''}`}>
      <Container className="checkout-container">
        {orderSuccess ? (
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="success" className="success-alert">
                <div className="text-center">
                  <div className="success-icon">
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <h2 className="success-title">
                    {getText('Замовлення успішно оформлено!', 'Order Successfully Placed!')}
                  </h2>
                  <p className="success-subtitle">
                    {getText('Дякуємо за ваше замовлення', 'Thank you for your order')}
                  </p>
                  <div className="order-info">
                    <Badge bg="primary" className="order-number-badge">
                      {getText('Номер замовлення', 'Order Number')}: {orderNumber}
                    </Badge>
                  </div>
                  <p className="redirect-info">
                    {getText(
                      'Ви будете перенаправлені на головну сторінку через 5 секунд...',
                      'You will be redirected to the homepage in 5 seconds...'
                    )}
                  </p>
                  <Button variant="primary" onClick={() => navigate('/')}>
                    {getText('Повернутися на головну', 'Return to Homepage')}
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        ) : (
          <>
            <div className="checkout-header">
              <Button 
                variant="outline-secondary" 
                onClick={handleBackToCart}
                className="back-button"
              >
                <i className="bi bi-arrow-left"></i> {getText('Назад', 'Back')}
              </Button>
              <h1 className="checkout-title">
                {getText('Оформлення замовлення', 'Order Checkout')}
              </h1>
            </div>

            {submitError && (
              <Alert variant="danger" className="mb-4">
                {submitError}
              </Alert>
            )}

            <div className="checkout-grid">
              <div className="order-summary-section">
                <h3 className="section-title">
                  {getText('Ваше замовлення', 'Your Order')}
                </h3>
                <div className="order-summary-body">
                  <div className="items-list">
                    <ListGroup variant="flush">
                      {cartItems.map(item => (
                        <ListGroup.Item key={item._id} className="checkout-item">
                          <div className="d-flex align-items-center">
                            <img 
                              src={item.images?.[0] ? `http://localhost:5000${item.images[0]}` : '/placeholder-product.jpg'} 
                              alt={getLocalizedText(item.name)}
                              className="checkout-item-image"
                            />
                            <div className="item-details ms-3 flex-grow-1">
                              <h6 className="item-name">{getLocalizedText(item.name)}</h6>
                              <div className="item-quantity text-muted">
                                {getText('Кількість', 'Quantity')}: {item.quantity}
                              </div>
                              <div className="item-price">
                                {item.oldPrice && (
                                  <span className="old-price">{item.oldPrice} ₴</span>
                                )}
                                <span className="current-price">
                                  {item.newPrice} ₴ × {item.quantity} = {(item.newPrice * item.quantity).toFixed(2)} ₴
                                </span>
                              </div>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </div>
                <div className="order-total">
                  <h4>{getText('Загальна сума', 'Total Amount')}: {total.toFixed(2)} ₴</h4>
                </div>
              </div>

              <div className="checkout-form-section">
                <h3 className="section-title">
                  {getText('Контактна інформація', 'Contact Information')}
                </h3>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText("Ім'я", 'First Name')} *</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.firstName}
                          placeholder={getText("Введіть ім'я", 'Enter first name')}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.firstName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText('Прізвище', 'Last Name')} *</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.lastName}
                          placeholder={getText('Введіть прізвище', 'Enter last name')}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.lastName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText('Телефон', 'Phone')} *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          isInvalid={!!errors.phone}
                          placeholder={getText('Введіть номер телефону', 'Enter phone number')}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.phone}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText('Електронна пошта', 'Email')} *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          isInvalid={!!errors.email}
                          placeholder={getText('Введіть email', 'Enter email')}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText('Місто', 'City')} *</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          isInvalid={!!errors.city}
                          placeholder={getText('Введіть місто', 'Enter city')}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.city}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>{getText('Пошта', 'Post Service')} *</Form.Label>
                        <Form.Select
                          name="postService"
                          value={formData.postService}
                          onChange={handleInputChange}
                        >
                          <option value="novaposhta">{getText('Нова Пошта', 'Nova Poshta')}</option>
                          <option value="ukrposhta">{getText('Укрпошта', 'Ukrposhta')}</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>{getText('Відділення', 'Post Office')} *</Form.Label>
                    <Form.Control
                      type="text"
                      name="postOffice"
                      value={formData.postOffice}
                      onChange={handleInputChange}
                      isInvalid={!!errors.postOffice}
                      placeholder={getText('Номер або адреса відділення', 'Office number or address')}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.postOffice}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>{getText('Спосіб оплати', 'Payment Method')} *</Form.Label>
                    <div className="payment-options">
                      <Form.Check
                        type="radio"
                        id="payment-card"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        label={
                          <div className="payment-option">
                            <i className="bi bi-credit-card"></i>
                            <span>{getText('Картка онлайн', 'Card Online')}</span>
                          </div>
                        }
                        className="payment-radio"
                      />
                      <Form.Check
                        type="radio"
                        id="payment-cash"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                        label={
                          <div className="payment-option">
                            <i className="bi bi-cash"></i>
                            <span>{getText('Оплата при отриманні', 'Cash on Delivery')}</span>
                          </div>
                        }
                        className="payment-radio"
                      />
                    </div>
                  </Form.Group>

                  <div className="checkout-actions d-flex gap-3 justify-content-center">
                    <Button 
                      variant="secondary" 
                      onClick={handleBackToCart}
                      disabled={isSubmitting}
                      className="checkout-back-btn"
                    >
                      {getText('Повернутися', 'Go Back')}
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={isSubmitting}
                      className="checkout-submit-btn"
                    >
                      {isSubmitting 
                        ? getText('Обробка...', 'Processing...') 
                        : getText('Підтвердити замовлення', 'Confirm Order')
                      }
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

export default CheckoutPage;