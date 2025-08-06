import React from 'react';
import { Button, Container, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/Main.css';

const NotFound = ({ darkMode, language }) => {
  const navigate = useNavigate();

  const messages = {
    en: {
      title: '404 - Page Not Found',
      message: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
    },
    uk: {
      title: '404 - Сторінку не знайдено',
      message: 'Сторінка, яку ви шукаєте, могла бути видалена, перейменована або тимчасово недоступна.'
    }
  };

  return (
    <Container fluid className={`not-found-container ${darkMode ? 'dark-theme' : ''}`}>
      <div className="not-found-content">
        <Image 
          src="/images/404.png" 
          alt="404 Not Found" 
          className="not-found-image"
          fluid
        />
        <h1 className="not-found-title">{messages[language].title}</h1>
        <p className="not-found-message">{messages[language].message}</p>
        <Button 
          variant="primary" 
          onClick={() => navigate('/')}
          className="not-found-button"
        >
          {language === 'uk' ? 'На головну' : 'Go to Home'}
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;