import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, Card, Container } from 'react-bootstrap';
import axios from 'axios';
import '../styles/Profile.css';

const ResetPassword = ({ darkMode, language }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валідація
    const newErrors = {};
    if (!password) {
      newErrors.password = language === 'uk' ? 'Пароль обов\'язковий' : 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = language === 'uk' 
        ? 'Пароль повинен містити мінімум 8 символів' 
        : 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = language === 'uk' 
        ? 'Паролі не співпадають' 
        : 'Passwords do not match';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      await axios.post('https://newstore-sepia.vercel.app/api/auth/reset-password', {
        token,
        newPassword: password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setErrors({ 
        apiError: error.response?.data?.message || 
        (language === 'uk' ? 'Помилка при скиданні пароля' : 'Password reset error')
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Container className={`reset-password-container ${darkMode ? 'dark-theme' : ''}`}>
        <Card className="reset-password-card">
          <Card.Body>
            <Alert variant="danger">
              {language === 'uk' 
                ? 'Невірне посилання для скидання пароля' 
                : 'Invalid password reset link'}
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className={`reset-password-container ${darkMode ? 'dark-theme' : ''}`}>
        <Card className="reset-password-card">
          <Card.Body>
            <Alert variant="success">
              {language === 'uk' 
                ? 'Пароль успішно змінено! Перенаправлення на сторінку входу...' 
                : 'Password changed successfully! Redirecting to login page...'}
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className={`reset-password-container ${darkMode ? 'dark-theme' : ''}`}>
      <Card className="reset-password-card">
        <Card.Body>
          <Card.Title className="mb-4">
            {language === 'uk' ? 'Встановіть новий пароль' : 'Set new password'}
          </Card.Title>
          
          {errors.apiError && <Alert variant="danger">{errors.apiError}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{language === 'uk' ? 'Новий пароль' : 'New password'}</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>{language === 'uk' ? 'Підтвердіть пароль' : 'Confirm password'}</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isInvalid={!!errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              className="w-100"
            >
              {loading 
                ? (language === 'uk' ? 'Обробка...' : 'Processing...') 
                : (language === 'uk' ? 'Змінити пароль' : 'Change password')}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;