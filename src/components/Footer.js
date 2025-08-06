import React, { useState } from 'react';
import { Container, Row, Col, Modal, Button } from 'react-bootstrap';
import { Facebook, Twitter, Instagram, Linkedin } from 'react-bootstrap-icons';
import '../App.css';

const Footer = ({ darkMode, language }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const handleShowModal = (content) => {
    setModalContent(content);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <footer className={`footer ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
        <Container>
          <Row className="align-items-center">
            <Col xs={12} md={8} className="text-center text-md-left">
              <ul className="list-inline mb-0">
                <li className="list-inline-item">
                  <Button variant="link" onClick={() => handleShowModal(language === 'uk' ? 'Про нас' : 'About Us')}>
                    {language === 'uk' ? 'Про нас' : 'About Us'}
                  </Button>
                </li>
                <li className="list-inline-item">
                  <Button variant="link" onClick={() => handleShowModal(language === 'uk' ? 'Оплата' : 'Payment')}>
                    {language === 'uk' ? 'Оплата' : 'Payment'}
                  </Button>
                </li>
                <li className="list-inline-item">
                  <Button variant="link" onClick={() => handleShowModal(language === 'uk' ? 'Доставка' : 'Delivery')}>
                    {language === 'uk' ? 'Доставка' : 'Delivery'}
                  </Button>
                </li>
                <li className="list-inline-item">
                  <Button variant="link" onClick={() => handleShowModal(language === 'uk' ? 'Контакти' : 'Contacts')}>
                    {language === 'uk' ? 'Контакти' : 'Contacts'}
                  </Button>
                </li>
              </ul>
            </Col>
            <Col xs={12} md={4} className="text-center text-md-right">
              <div className="social-icons">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><Linkedin /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><Instagram /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><Twitter /></a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><Facebook /></a>
              </div>
            </Col>
          </Row>
        </Container>
      </footer>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        // Застосовуємо клас до вмісту модального вікна в залежності від darkMode
        contentClassName={`${darkMode ? 'modal-content-dark' : 'modal-content-light'}`}
        centered // Опціонально, для центрування модального вікна
      >
        {/* Додаємо клас до заголовку для кращої стилізації кнопки закриття в темній темі */}
        <Modal.Header closeButton className={darkMode ? 'modal-header-dark' : ''}>
          <Modal.Title>{modalContent}</Modal.Title>
        </Modal.Header>
          <Modal.Body>
            {modalContent === (language === 'uk' ? 'Про нас' : 'About Us') && (
              <p>
                {language === 'uk'
                  ? 'Ми — інтернет-магазин, що пропонує якісну продукцію за доступними цінами. Наша команда прагне забезпечити найкращий сервіс та швидке обслуговування для кожного клієнта.'
                  : 'We are an online store offering quality products at affordable prices. Our team strives to provide the best service and fast support for every customer.'}
              </p>
            )}
            {modalContent === (language === 'uk' ? 'Оплата' : 'Payment') && (
              <p>
                {language === 'uk'
                  ? 'Ми приймаємо оплату банківськими картками, а також готівкою при отриманні (накладний платіж).'
                  : 'We accept payment via bank cards, as well as cash on delivery (COD).'}
              </p>
            )}
            {modalContent === (language === 'uk' ? 'Доставка' : 'Delivery') && (
              <p>
                {language === 'uk'
                  ? 'Доставка здійснюється по всій Україні за допомогою "Нової Пошти" або "Укрпошти". Термін доставки — 1-3 робочі дні. Можлива безкоштовна доставка при замовленні від 1500 грн.'
                  : 'Delivery is available throughout Ukraine via Nova Poshta or Ukrposhta. Delivery time is 1–3 business days. Free delivery is available for orders over UAH 1500.'}
              </p>
            )}
            {modalContent === (language === 'uk' ? 'Контакти' : 'Contacts') && (
              <p>
                {language === 'uk'
                  ? 'Зв’язатися з нами можна за номером телефону 123-45-67 або електронною поштою support@example.com. Ми працюємо щодня з 9:00 до 18:00.'
                  : 'You can contact us at 123-45-67 or via email at support@example.com. We are available daily from 9:00 to 18:00.'}
              </p>
            )}
          </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            {language === 'uk' ? 'Закрити' : 'Close'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Footer;