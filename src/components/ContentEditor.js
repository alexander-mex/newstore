import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Tab, Tabs, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/ContentEditor.css';

const ContentEditor = ({ show, onHide, darkMode, language }) => {
  const [activeTab, setActiveTab] = useState('homepage');
  const [homePageCards, setHomePageCards] = useState([]);
  const [moduleSliderCards, setModuleSliderCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const { triggerCardsRefresh } = useAuth();

  const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url);
        return response;
      } catch (error) {
        if (i === retries - 1) return { error, data: null };
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
  
      const homeResponse = await fetchWithRetry('/api/content/cards', 3, 1000);
      const moduleResponse = await fetchWithRetry('/api/content/module-cards', 3, 1000);
      const filterResponse = await fetchWithRetry('/api/products/filters', 3, 1000);
  
      let errors = [];
      if (homeResponse.error) errors.push('Failed to load homepage cards');
      if (moduleResponse.error) errors.push('Failed to load module cards');
      if (filterResponse.error) errors.push('Failed to load filters');
  
      if (errors.length > 0) {
        console.error('Fetch errors:', errors);
        showMessage(language === 'uk' ? 'Помилка завантаження контенту' : 'Error loading content', 'danger');
        return;
      }
  
      const normalizedHomeCards = (homeResponse.data?.cards || []).map(card => ({
        ...card,
        subcategory: card.subcategory || { uk: '', en: '' },
        isLinkEditable: card.isLinkEditable || false,
        link: card.link || '',
        category: ['accessories', 'footwear', 'clothing', 'bags'].includes(card.category) ? card.category : undefined
      }));
  
      const normalizedModuleCards = (moduleResponse.data?.cards || []).map(card => ({
        ...card,
        newPrice: card.newPrice || { uk: '' },
        oldPrice: card.oldPrice || { uk: '' },
        link: card.link || '',
      }));
  
      setHomePageCards(normalizedHomeCards);
      setModuleSliderCards(normalizedModuleCards);
    } catch (error) {
      console.error('Unexpected error fetching content:', error);
      showMessage(language === 'uk' ? 'Несподівана помилка' : 'Unexpected error', 'danger');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (show) {
      fetchContent();
    }
  }, [show, fetchContent]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveHomePageCards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showMessage(language === 'uk' ? 'Токен авторизації відсутній. Увійдіть у систему.' : 'Authorization token missing. Please log in.', 'danger');
        return;
      }
  
      const isValid = homePageCards.every(card =>
        card.description &&
        typeof card.description.uk === 'string' &&
        typeof card.description.en === 'string' &&
        card.title &&
        typeof card.title.uk === 'string' &&
        typeof card.title.en === 'string' &&
        (!card.image || /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(card.image)) &&
        (card.link === '' || /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(card.link) || card.link.startsWith('/')) // Перевірка валідності link
      );
  
      if (!isValid) {
        showMessage(language === 'uk' ? 'Неправильний формат даних картки (назва, опис, зображення або посилання)' : 'Invalid card data format (title, description, image, or link)', 'danger');
        setLoading(false);
        return;
      }
  
      // Нормалізація даних перед відправкою
      const normalizedCards = homePageCards.map(card => ({
        ...card,
        link: card.link || '', // Гарантуємо, що link завжди є, навіть якщо порожній
      }));
  
      console.log('Data sent to server:', normalizedCards); // Додано логування
      await axios.put('/api/content/cards', { cards: normalizedCards }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage(language === 'uk' ? 'Картки головної сторінки збережено!' : 'Homepage cards saved!');
      triggerCardsRefresh();
    } catch (error) {
      console.error('Error saving homepage cards:', error.response?.data || error.message);
      showMessage(language === 'uk' ? 'Помилка збереження' : 'Save error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const saveModuleSliderCards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showMessage(language === 'uk' ? 'Токен авторизації відсутній. Увійдіть у систему.' : 'Authorization token missing. Please log in.', 'danger');
        return;
      }

      const isValid = moduleSliderCards.every(card =>
        card.title && typeof card.title.uk === 'string' && typeof card.title.en === 'string' &&
        card.description && typeof card.description.uk === 'string' && typeof card.description.en === 'string' &&
        card.newPrice && typeof card.newPrice.uk === 'string' &&
        card.oldPrice && typeof card.oldPrice.uk === 'string' &&
        card.link && typeof card.link === 'string' // Ensure link is valid
      );

      if (!isValid) {
        showMessage(language === 'uk' ? 'Неправильний формат даних картки' : 'Invalid card data format', 'danger');
        return;
      }

      console.log('Saving module slider cards:', moduleSliderCards); // Додано логування
      await axios.put('/api/content/module-cards', { cards: moduleSliderCards }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage(language === 'uk' ? 'Картки слайдера збережено!' : 'Module cards saved!');
      triggerCardsRefresh();
    } catch (error) {
      console.error('Error saving module cards:', error);
      showMessage(language === 'uk' ? 'Помилка збереження' : 'Save error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const addHomePageCard = () => {
    const newCard = {
      id: Date.now(),
      title: { uk: '', en: '' },
      description: { uk: '', en: '' },
      image: 'https://images.pexels.com/photos/5632393/pexels-photo-5632393.jpeg',
      link: '',
    };
    setHomePageCards([...homePageCards, newCard]);
  };

  const updateHomePageCard = (index, field, value) => {
    const updatedCards = [...homePageCards];
    const card = updatedCards[index];
  
    // Додано перевірку для поля link
    if (field === 'link') {
      const isValidUrl = value === '' || /^(https?:\/\/[^\s$.?#].[^\s]*)$/.test(value) || value.startsWith('/');
      if (!isValidUrl) {
        showMessage(language === 'uk' ? 'Некоректне посилання' : 'Invalid URL or path', 'danger');
        return;
      }
    }
  
    updatedCards[index] = { ...card, [field]: value };
    setHomePageCards(updatedCards);
  };

  const deleteHomePageCard = (index) => {
    console.log('Deleting card at index:', index);
    const updatedCards = homePageCards.filter((_, i) => i !== index);
    setHomePageCards(updatedCards);
  };

  const addModuleSliderCard = () => {
    const newCard = {
      id: Date.now(),
      imgSrc: '',
      title: { uk: '', en: '' },
      description: { uk: '', en: '' },
      newPrice: { uk: '' },
      oldPrice: { uk: '' },
      link: '',
      isNewPrice: false,
      isSale: false,
    };
    setModuleSliderCards([...moduleSliderCards, newCard]);
  };

  const updateModuleSliderCard = (index, field, value) => {
    const updatedCards = [...moduleSliderCards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setModuleSliderCards(updatedCards);
  };

  const deleteModuleSliderCard = (index) => {
    const updatedCards = moduleSliderCards.filter((_, i) => i !== index);
    setModuleSliderCards(updatedCards);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      className={darkMode ? 'dark-modal' : ''}
      backdrop="static"
    >
      <Modal.Header closeButton className={darkMode ? 'bg-dark text-white' : ''}>
        <Modal.Title>
          {language === 'uk' ? 'Редагування контенту' : 'Content Editor'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={darkMode ? 'bg-dark text-white' : ''}>
        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" />
          </div>
        )}
        {message && (
          <Alert variant={messageType} className="mb-3">
            {message}
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className={`mb-3 ${darkMode ? 'dark-tabs' : ''}`}
        >
          <Tab eventKey="homepage" title={language === 'uk' ? 'Головна сторінка' : 'Homepage'}>
            <div className="mb-3 d-flex gap-2">
              <Button variant="success" onClick={addHomePageCard} className="btn-add-card">
                <i className="bi bi-plus-circle me-2"></i>
                {language === 'uk' ? 'Додати картку' : 'Add Card'}
              </Button>
              <Button
                variant="primary"
                onClick={saveHomePageCards}
                disabled={loading}
                className="btn-save-card"
              >
                <i className="bi bi-save me-2"></i>
                {loading
                  ? (language === 'uk' ? 'Збереження...' : 'Saving...')
                  : (language === 'uk' ? 'Зберегти' : 'Save')}
              </Button>
            </div>
            <Row>
              {homePageCards.map((card, index) => (
                <Col md={6} key={card.id || index} className="mb-4">
                  <Card className={`card-editor ${darkMode ? 'bg-secondary text-white' : ''}`}>
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{language === 'uk' ? 'Картка' : 'Card'} {index + 1}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteHomePageCard(index)}
                          className='btn-delete-card'
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Назва (UK)' : 'Title (UK)'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.title.uk}
                              onChange={(e) => updateHomePageCard(index, 'title', { ...card.title, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                              placeholder={language === 'uk' ? 'Введіть назву' : 'Enter title'}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Назва (EN)' : 'Title (EN)'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.title.en}
                              onChange={(e) => updateHomePageCard(index, 'title', { ...card.title, en: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                              placeholder={language === 'uk' ? 'Введіть назву' : 'Enter title'}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Опис (UK)' : 'Description (UK)'}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={card.description.uk}
                              onChange={(e) => updateHomePageCard(index, 'description', { ...card.description, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                              placeholder={language === 'uk' ? 'Введіть опис' : 'Enter description'}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Опис (EN)' : 'Description (EN)'}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={card.description.en}
                              onChange={(e) => updateHomePageCard(index, 'description', { ...card.description, en: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                              placeholder={language === 'uk' ? 'Введіть опис' : 'Enter description'}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>{language === 'uk' ? 'Зображення (URL)' : 'Image (URL)'}</Form.Label>
                        <Form.Control
                          type="text"
                          value={card.image}
                          onChange={(e) => updateHomePageCard(index, 'image', e.target.value)}
                          className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>{language === 'uk' ? 'Посилання' : 'Link'}</Form.Label>
                        <Form.Control
                          type="text"
                          value={card.link}
                          onChange={(e) => updateHomePageCard(index, 'link', e.target.value)}
                          className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                          placeholder={language === 'uk' ? 'Введіть посилання' : 'Enter link'}
                        />
                      </Form.Group>

                      {card.image && (
                        <div className="text-center">
                          <img
                            src={card.image}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }}
                            className="rounded"
                          />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab>

          <Tab eventKey="slider" title={language === 'uk' ? 'Слайдер модулів' : 'Module Slider'}>
            <div className="mb-3 d-flex gap-2">
              <Button variant="success" onClick={addModuleSliderCard} className="btn-add-card">
                <i className="bi bi-plus-circle me-2"></i>
                {language === 'uk' ? 'Додати картку' : 'Add Card'}
              </Button>
              <Button
                variant="primary"
                onClick={saveModuleSliderCards}
                disabled={loading}
                className="btn-save-card"
              >
                <i className="bi bi-save me-2"></i>
                {loading
                  ? (language === 'uk' ? 'Збереження...' : 'Saving...')
                  : (language === 'uk' ? 'Зберегти' : 'Save')}
              </Button>
            </div>

            <Row>
              {moduleSliderCards.map((card, index) => (
                <Col md={6} key={card.id || index} className="mb-4">
                  <Card className={darkMode ? 'bg-secondary card-editor card-editor-slider text-white' : 'card-editor-slider'}>
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{language === 'uk' ? 'Картка' : 'Card'} {index + 1}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteModuleSliderCard(index)}
                          className='btn-delete-card'
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>{language === 'uk' ? 'Зображення (URL)' : 'Image (URL)'}</Form.Label>
                        <Form.Control
                          type="text"
                          value={card.imgSrc}
                          onChange={(e) => updateModuleSliderCard(index, 'imgSrc', e.target.value)}
                          className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Назва (UK)' : 'Title (UK)'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.title.uk}
                              onChange={(e) => updateModuleSliderCard(index, 'title', { ...card.title, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Назва (EN)' : 'Title (EN)'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.title.en}
                              onChange={(e) => updateModuleSliderCard(index, 'title', { ...card.title, en: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Опис (UK)' : 'Description (UK)'}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={card.description.uk}
                              onChange={(e) => updateModuleSliderCard(index, 'description', { ...card.description, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Опис (EN)' : 'Description (EN)'}</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={card.description.en}
                              onChange={(e) => updateModuleSliderCard(index, 'description', { ...card.description, en: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Ціна (UK)' : 'Price (UK)'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.newPrice?.uk || ''}
                              onChange={(e) => updateModuleSliderCard(index, 'newPrice', { ...card.newPrice, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{language === 'uk' ? 'Стара ціна (UK)' : 'Old Price'}</Form.Label>
                            <Form.Control
                              type="text"
                              value={card.oldPrice?.uk || ''}
                              onChange={(e) => updateModuleSliderCard(index, 'oldPrice', { ...card.oldPrice, uk: e.target.value })}
                              className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>{language === 'uk' ? 'Посилання' : 'Link'}</Form.Label>
                        <Form.Control
                          type="text"
                          value={card.link}
                          onChange={(e) => updateModuleSliderCard(index, 'link', e.target.value)}
                          className={darkMode ? 'bg-dark text-white border-secondary' : ''}
                          placeholder={language === 'uk' ? 'Введіть посилання' : 'Enter link'}
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label={language === 'uk' ? 'Новинка' : 'New'}
                            checked={card.isNewPrice}
                            onChange={(e) => updateModuleSliderCard(index, 'isNewPrice', e.target.checked)}
                          />
                        </Col>
                        <Col md={6}>
                          <Form.Check
                            type="checkbox"
                            label={language === 'uk' ? 'Знижка' : 'Sale'}
                            checked={card.isSale}
                            onChange={(e) => updateModuleSliderCard(index, 'isSale', e.target.checked)}
                          />
                        </Col>
                      </Row>

                      {card.imgSrc && (
                        <div className="text-center mt-4">
                          <img
                            src={card.imgSrc}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }}
                            className="rounded"
                          />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer className={darkMode ? 'bg-dark border-secondary' : ''}>
        <Button variant="secondary" onClick={onHide}>
          {language === 'uk' ? 'Закрити' : 'Close'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ContentEditor;