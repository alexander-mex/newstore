// src/pages/OrderSuccessPage.js
import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderSuccessPage = ({ darkMode, toggleDarkMode, language, toggleLanguage }) => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const getText = (ukText, enText) => (language === 'uk' ? ukText : enText);

  return (
    <div className={`order-success-page ${darkMode ? 'dark-theme' : ''}`}>
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        language={language}
        toggleLanguage={toggleLanguage}
      />
      
      <Container className="success-container">
        <Card className="success-card">
          <Card.Body className="text-center">
            <div className="success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h1 className="success-title">
              {getText('Замовлення успішно оформлено!', 'Order Successfully Placed!')}
            </h1>
            <p className="success-subtitle">
              {getText('Дякуємо за ваше замовлення', 'Thank you for your order')}
            </p>
            <div className="order-info">
              <h3>{getText('Номер замовлення', 'Order Number')}: <span className="order-number">{orderNumber}</span></h3>
              <p className="order-description">
                {getText(
                  'Ми надішлемо вам електронний лист з деталями замовлення найближчим часом.',
                  'We will send you an email with order details shortly.'
                )}
              </p>
            </div>
            <div className="success-actions">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/')}
                className="home-button"
              >
                {getText('На головну', 'Go to Home')}
              </Button>
              <Button 
                variant="outline-secondary" 
                size="lg"
                onClick={() => navigate('/profile')}
                className="orders-button"
              >
                {getText('Мої замовлення', 'My Orders')}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
      
      <Footer darkMode={darkMode} language={language} />
    </div>
  );
};

export default OrderSuccessPage;