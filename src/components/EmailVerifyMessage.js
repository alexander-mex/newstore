import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/Main.css';

const EmailVerifyMessage = ({ success, darkMode, language }) => {
  const navigate = useNavigate();

  const messages = {
    success: {
      en: {
        title: 'Email Verified Successfully!',
        message: 'Thank you for verifying your email address. You can now enjoy all the features of our platform.'
      },
      uk: {
        title: 'Електронну пошту підтверджено!',
        message: 'Дякуємо за підтвердження електронної адреси. Тепер ви можете користуватися всіма функціями платформи.'
      }
    },
    failed: {
      en: {
        title: 'Verification Failed',
        message: 'Unfortunately, we were unable to verify your email address. Please try again or contact support.'
      },
      uk: {
        title: 'Помилка перевірки',
        message: 'На жаль, нам не вдалося підтвердити вашу електронну адресу. Будь ласка, спробуйте ще раз або зверніться до підтримки.'
      }
    }
  };

  const content = success ? messages.success[language] : messages.failed[language];

  return (
    <Container fluid className={`email-verify-wrapper ${darkMode ? 'dark' : 'light'}`}>
      <h1>{content.title}</h1>
      <p>{content.message}</p>
      <Button className="email-verify-btn" onClick={() => navigate('/')}>
        {language === 'uk' ? 'На головну' : 'Go to Home'}
      </Button>
    </Container>
  );
};

export default EmailVerifyMessage;