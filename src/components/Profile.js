import React, { useState, useEffect, useCallback } from 'react';
import { Button, Form, Modal, Alert, Card, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { AUTH_API_URL } from '../config/constants';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Profile.css';

const Profile = ({ darkMode, language, toggleDarkMode, toggleLanguage }) => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((message, type = 'success') => {
    toast[type](message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: darkMode ? 'dark' : 'light',
    });
  }, [darkMode]);

  // Create axios instance with interceptors
  const createAxiosInstance = useCallback(() => {
    const instance = axios.create();
    
    // Request interceptor to add auth header
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          logout();
          navigate('/login');
          showToast(
            language === 'uk' ? 'Сесія закінчилася. Увійдіть знову.' : 'Session expired. Please login again.',
            'error'
          );
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [logout, navigate, showToast, language]);

  const confirmResetPassword = () => {
    setShowResetPasswordModal(true);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const axiosInstance = createAxiosInstance();

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${AUTH_API_URL}/profile`);
        const { name, email, phone } = response.data;
        setProfileData({ name, email, phone: phone || '' });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        if (error.response?.status !== 401) {
          showToast(
            language === 'uk' ? 'Помилка завантаження профілю' : 'Error loading profile',
            'error'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get(`${AUTH_API_URL}/orders`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Don't show error for orders as it's not critical
      }
    };

    fetchProfileData();
    fetchOrders();
  }, [isAuthenticated, language, createAxiosInstance, navigate, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.name) {
      newErrors.name = language === 'uk' ? "Ім'я обов'язкове" : 'Name is required';
    }
    if (!profileData.email) {
      newErrors.email = language === 'uk' ? 'Пошта обов\'язкова' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = language === 'uk' ? 'Невірний формат пошти' : 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.oldPassword) {
      newErrors.oldPassword = language === 'uk' ? 'Старий пароль обов\'язковий' : 'Old password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = language === 'uk' ? 'Новий пароль обов\'язковий' : 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = language === 'uk' ? 'Пароль повинен містити мінімум 8 символів' : 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = language === 'uk' ? 'Паролі не співпадають' : 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (validateProfile()) {
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.put(`${AUTH_API_URL}/profile`, profileData);

        let successMsg = language === 'uk' ? 'Профіль оновлено!' : 'Profile updated!';
        if (response.data.emailChanged) {
          if (!response.data.emailVerified) {
            successMsg = language === 'uk'
              ? 'Профіль оновлено! Лист для підтвердження нової пошти відправлено.'
              : 'Profile updated! Verification email sent to your new address.';
          }
        }

        setSuccessMessage(successMsg);
        showToast(successMsg);
      } catch (error) {
        console.error('Error updating profile:', error);
        if (error.response?.status !== 401) {
          showToast(
            language === 'uk' ? 'Помилка при оновленні профілю' : 'Error updating profile',
            'error'
          );
        }
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (validatePassword()) {
      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.put(`${AUTH_API_URL}/password`, {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        });
        showToast(language === 'uk' ? 'Пароль змінено!' : 'Password changed!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Error changing password:', error);
        if (error.response?.status !== 401) {
          const errorMsg = error.response?.data?.message?.includes('Invalid old password')
            ? language === 'uk' ? 'Невірний старий пароль' : 'Invalid old password'
            : language === 'uk' ? 'Помилка зміни пароля' : 'Error changing password';
          showToast(errorMsg, 'error');
        }
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.post(`${AUTH_API_URL}/forgot-password`, {
        email: profileData.email
      });
      showToast(
        language === 'uk'
          ? 'Лист з інструкціями відправлено на вашу пошту'
          : 'Instructions sent to your email'
      );
    } catch (error) {
      console.error('Error sending reset password email:', error);
      if (error.response?.status !== 401) {
        showToast(
          error.response?.data?.message ||
          (language === 'uk' ? 'Помилка відправки листа' : 'Error sending email'),
          'error'
        );
      }
    }
  };

  const handleDeleteAccount = async (password) => {
    if (!password) {
      showToast(language === 'uk' ? 'Будь ласка, введіть ваш пароль' : 'Please enter your password', 'error');
      return;
    }
  
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${AUTH_API_URL}/profile`, {
        data: { password }
      });
      showToast(language === 'uk' ? 'Акаунт успішно видалено' : 'Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.response?.status !== 401) {
        showToast(
          error.response?.data?.message ||
          (language === 'uk' ? 'Помилка при видаленні акаунту' : 'Error deleting account'),
          'error'
        );
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <>
      <ToastContainer />
      <Container className={`profile-container ${darkMode ? 'dark-theme' : ''}`}>
        <div className="profile-content">
          <div className="profile-header">
            <div>
              <h2>
                {language === 'uk' ? 'Мій профіль' : 'My Profile'}
              </h2>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
              className="profile-button"
            >
              {language === 'uk' ? 'На головну' : 'Home'}
            </Button>
          </div>

          {successMessage && (
            <Alert variant="success" className="profile-alert">
              {successMessage}
            </Alert>
          )}

          {errors.apiError && (
            <Alert variant="danger" className="profile-alert">
              {errors.apiError}
            </Alert>
          )}

          <div className="profile-grid">
            <Card className="profile-card profile-details-card">
              <Card.Body>
                <Card.Title className="mb-4">{language === 'uk' ? 'Особисті дані' : 'Personal Details'}</Card.Title>
                <Form onSubmit={handleProfileSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? "Ім'я" : 'Name'}</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? 'Пошта' : 'Email'}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? 'Телефон' : 'Phone'}</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={profileData.phone || ''}
                      onChange={handleInputChange}
                      placeholder={language === 'uk' ? 'Введіть ваш телефон' : 'Enter your phone'}
                    />
                  </Form.Group>

                  <div className="profile-form-buttons">
                    <Button variant="primary" type="submit" className="profile-button">
                      {language === 'uk' ? 'Зберегти зміни' : 'Save changes'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="profile-card password-card">
              <Card.Body>
                <Card.Title className="mb-4">{language === 'uk' ? 'Змінити пароль' : 'Change Password'}</Card.Title>
                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? 'Старий пароль' : 'Old Password'}</Form.Label>
                    <Form.Control
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.oldPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.oldPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? 'Новий пароль' : 'New Password'}</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.newPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.newPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{language === 'uk' ? 'Підтвердіть новий пароль' : 'Confirm New Password'}</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!errors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="profile-form-buttons">
                    <Button variant="primary" type="submit" className="profile-button">
                      {language === 'uk' ? 'Змінити пароль' : 'Change Password'}
                    </Button>
                    <Button
                      variant="warning"
                      onClick={confirmResetPassword}
                      className="profile-button"
                    >
                      {language === 'uk' ? 'Скинути пароль' : 'Reset Password'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>

          <div className="profile-actions">
            <h3>{language === 'uk' ? 'Дії з акаунтом' : 'Account Actions'}</h3>
            <div className="profile-actions-buttons">
              <Button
                variant="primary"
                onClick={() => setShowOrdersModal(true)}
                className="profile-button"
              >
                {language === 'uk' ? 'Мої замовлення' : 'My Orders'}
              </Button>
              <Button
                variant="danger"
                onClick={handleLogout}
                className="profile-button"
              >
                {language === 'uk' ? 'Вийти' : 'Logout'}
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                className="profile-button"
              >
                {language === 'uk' ? 'Видалити акаунт' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>

        <Modal
          show={showOrdersModal}
          onHide={() => setShowOrdersModal(false)}
          centered
          className={darkMode ? 'dark-theme' : ''}
        >
          <Modal.Header closeButton>
            <Modal.Title>{language === 'uk' ? 'Мої замовлення' : 'My Orders'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {orders.length > 0 ? (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order._id} className="order-item">
                    <p>
                      <strong>{language === 'uk' ? 'Замовлення #' : 'Order #'}</strong> {order._id}
                    </p>
                    <p>
                      <strong>{language === 'uk' ? 'Дата:' : 'Date:'}</strong>{' '}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>{language === 'uk' ? 'Сума:' : 'Total:'}</strong> {order.total} грн
                    </p>
                    <p>
                      <strong>{language === 'uk' ? 'Статус:' : 'Status:'}</strong>{' '}
                      {order.status || (language === 'uk' ? 'В обробці' : 'Processing')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>{language === 'uk' ? 'У вас ще немає замовлень' : 'You have no orders yet'}</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setShowOrdersModal(false)}
              className="profile-button"
            >
              {language === 'uk' ? 'Закрити' : 'Close'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
          className={darkMode ? 'dark-theme' : ''}
        >
          <Modal.Header closeButton>
            <Modal.Title>{language === 'uk' ? 'Підтвердження видалення' : 'Confirm Deletion'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>{language === 'uk' ? 'Введіть ваш пароль' : 'Enter your password'}</Form.Label>
              <Form.Control
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder={language === 'uk' ? 'Пароль' : 'Password'}
              />
            </Form.Group>
            {language === 'uk'
              ? 'Ви впевнені, що хочете видалити свій акаунт? Цю дію неможливо скасувати.'
              : 'Are you sure you want to delete your account? This action cannot be undone.'}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="profile-button"
            >
              {language === 'uk' ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteAccount(deleteAccountPassword)}
              className="profile-button"
            >
              {language === 'uk' ? 'Видалити' : 'Delete'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showResetPasswordModal}
          onHide={() => setShowResetPasswordModal(false)}
          centered
          className={darkMode ? 'dark-theme' : ''}
        >
          <Modal.Header closeButton>
            <Modal.Title>{language === 'uk' ? 'Скидання пароля' : 'Password Reset'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {language === 'uk'
              ? 'На вашу пошту буде відправлено лист для скидання пароля. Продовжити?'
              : 'A password reset email will be sent to your email. Continue?'}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowResetPasswordModal(false)}
              className="profile-button"
            >
              {language === 'uk' ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowResetPasswordModal(false);
                handleResetPassword();
              }}
              className="profile-button"
            >
              {language === 'uk' ? 'Продовжити' : 'Continue'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default Profile;