import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import "../App.css";

const AuthModals = ({ language, darkMode, isAuthenticated, mobileView = false, triggerButton = null }) => {
  const { login, register } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    loginEmail: "",
    loginPassword: "",
    registerName: "",
    registerEmail: "",
    registerPassword: "",
    registerConfirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  const handleClose = () => {
    setShowModal(false);
    setErrors({});
    setSuccessMessage("");
    setIsLoading(false);
    setShowForgotPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTriggerClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      window.location.href = "/profile";
    } else {
      setAuthMode('login');
      setShowModal(true);
    }
  };

  const defaultTriggerButton = (
    <Button
      variant={darkMode ? "outline-light" : "outline-dark"}
      onClick={handleTriggerClick}
      className={mobileView ? "mobile-auth-btn" : "profile-btn"}
      style={mobileView ? { width: "100%" } : {}}
    >
      <i className="bi bi-person"></i>
      {isAuthenticated 
        ? (language === "uk" ? "Профіль" : "Profile")
        : (language === "uk" ? "Увійти" : "Login")}
    </Button>
  );

  const validatePassword = (password) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>+-=_"';]/.test(password);
    return password.length >= 8 && hasLetter && hasNumber && hasSpecialChar;
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.loginEmail) {
      newErrors.loginEmail = language === "uk" ? "Пошта обов'язкова" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.loginEmail)) {
      newErrors.loginEmail = language === "uk" ? "Невірний формат пошти" : "Invalid email format";
    }
    if (!formData.loginPassword) {
      newErrors.loginPassword = language === "uk" ? "Пароль обов'язковий" : "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!formData.registerName) {
      newErrors.registerName = language === "uk" ? "Ім'я обов'язкове" : "Name is required";
    }
    if (!formData.registerEmail) {
      newErrors.registerEmail = language === "uk" ? "Пошта обов'язкова" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.registerEmail)) {
      newErrors.registerEmail = language === "uk" ? "Невірний формат пошти" : "Invalid email format";
    }
    if (!formData.registerPassword) {
      newErrors.registerPassword = language === "uk" ? "Пароль обов'язковий" : "Password is required";
    } else if (!validatePassword(formData.registerPassword)) {
      newErrors.registerPassword = language === "uk"
        ? "Пароль повинен містити мінімум 8 символів: літери, цифри та символи"
        : "Password must contain at least 8 characters: letters, numbers and characters";
    }
    if (formData.registerPassword !== formData.registerConfirmPassword) {
      newErrors.registerConfirmPassword = language === "uk"
        ? "Паролі не співпадають"
        : "Passwords don't match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (validateLogin()) {
      setIsLoading(true);
      try {
        const response = await login(
          formData.loginEmail,
          formData.loginPassword
        );

        if (response.emailNotVerified) {
          setErrors({
            apiError: language === "uk"
              ? "Пошта не підтверджена. Натисніть 'Надіслати повторно', щоб отримати лист знову."
              : "Email not verified. Click 'Resend' to get a new verification email.",
            needResend: true,
            userId: response.userId
          });
        } else if (response.success) {
          setSuccessMessage(language === "uk" ? "Успішний вхід!" : "Login successful!");
          setTimeout(handleClose, 150000000);
        }
      } catch (error) {
        setErrors({ apiError: error.message || String(error) });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await axios.post('https://newstore-sepia.vercel.app/api/auth/resend-verification', {
        userId: errors.userId
      });
      setSuccessMessage(language === "uk"
        ? "Лист відправлено повторно!"
        : "Email resent successfully!");
    } catch (error) {
      setErrors({ apiError: error.response?.data?.message || error.message || String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (validateRegister()) {
      setIsLoading(true);
      try {
        const { success, error } = await register({
          name: formData.registerName,
          email: formData.registerEmail,
          password: formData.registerPassword
        });

        if (success) {
          setSuccessMessage(language === "uk" ? "Реєстрація успішна!" : "Registration successful!");
          setTimeout(handleClose, 15000000);
        } else {
          setErrors({ apiError: error.message || String(error) });
        }
      } catch (error) {
        setErrors({ apiError: error.message || String(error) });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsLoading(true);
      await axios.post('https://newstore-sepia.vercel.app/api/auth/forgot-password', {
        email: forgotPasswordEmail
      });
      setSuccessMessage(language === "uk" 
        ? "Лист з інструкціями відправлено на вашу пошту" 
        : "Instructions sent to your email");
      setShowForgotPassword(false);
    } catch (error) {
      setErrors({ apiError: error.response?.data?.message || error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер модального вікна
  const renderModalContent = () => {
    if (authMode === 'login') {
      return (
        <>
          <Modal.Header closeButton className="modal-header">
            <Modal.Title className="modal-title">
              {language === "uk" ? "Вхід" : "Login"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body">
            {errors.apiError && (
              <Alert variant="danger" className="error-message">
                {typeof errors.apiError === 'object' ? errors.apiError.message || String(errors.apiError) : errors.apiError}
                {errors.needResend && (
                  <Button variant="link" onClick={handleResendVerification}>
                    {language === "uk" ? "Надіслати повторно" : "Resend"}
                  </Button>
                )}
              </Alert>
            )}
            {successMessage ? (
              <Alert variant="success" className="success-message">
                {successMessage}
              </Alert>
            ) : (
              <Form onSubmit={handleLoginSubmit} className="auth-form">
                <Form.Group className="mb-3 form-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Пошта" : "Email"}</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="loginEmail"
                    value={formData.loginEmail}
                    onChange={handleChange}
                    isInvalid={!!errors.loginEmail}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.loginEmail}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3 form-group password-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Пароль" : "Password"}</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="loginPassword"
                    value={formData.loginPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.loginPassword}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.loginPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="form-links">
                  <Button
                    variant="link"
                    onClick={() => setAuthMode('register')}
                    className="form-link"
                  >
                    {language === "uk" ? "Реєстрація" : "Register"}
                  </Button>
                  <Button
                    type="submit"
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      language === "uk" ? "Увійти" : "Login"
                    )}
                  </Button>
                  <Button 
                    variant="link" 
                    onClick={() => setShowForgotPassword(true)}
                    className="forgot-password-link"
                  >
                    {language === "uk" ? "Забули пароль?" : "Forgot password?"}
                  </Button>
                </div>
              </Form>
            )}
          </Modal.Body>
        </>
      );
    } else {
      return (
        <>
          <Modal.Header closeButton className="modal-header">
            <Modal.Title className="modal-title">
              {language === "uk" ? "Реєстрація" : "Register"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body">
            {errors.apiError && (
              <Alert variant="danger" className="error-message">
                {typeof errors.apiError === 'object' ? errors.apiError.message || String(errors.apiError) : errors.apiError}
              </Alert>
            )}
            {successMessage ? (
              <Alert variant="success" className="success-message">
                {successMessage}
              </Alert>
            ) : (
              <Form onSubmit={handleRegisterSubmit} className="auth-form">
                <Form.Group className="mb-3 form-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Ім'я" : "Name"}</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="registerName"
                    value={formData.registerName}
                    onChange={handleChange}
                    isInvalid={!!errors.registerName}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.registerName}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3 form-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Пошта" : "Email"}</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="registerEmail"
                    value={formData.registerEmail}
                    onChange={handleChange}
                    isInvalid={!!errors.registerEmail}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.registerEmail}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3 form-group password-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Пароль" : "Password"}</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="registerPassword"
                    value={formData.registerPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.registerPassword}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.registerPassword}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3 form-group password-group">
                  <Form.Label className="form-label">
                    <span className="label-text">{language === "uk" ? "Підтвердження пароля" : "Confirm Password"}</span>
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="registerConfirmPassword"
                    value={formData.registerConfirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.registerConfirmPassword}
                    className="form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="error-message">
                    {errors.registerConfirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
                <div className="form-links">
                  <Button
                    variant="link"
                    onClick={() => setAuthMode('login')}
                    className="form-link"
                  >
                    {language === "uk" ? "Вже маєте акаунт? Увійти" : "Already have an account? Login"}
                  </Button>
                  <Button
                    type="submit"
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      language === "uk" ? "Зареєструватися" : "Register"
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Modal.Body>
        </>
      );
    }
  };

  return (
    <>
      {/* Рендеримо кастомну кнопку або дефолтну */}
      {triggerButton ? (
        React.cloneElement(triggerButton, {
          onClick: handleTriggerClick
        })
      ) : (
        defaultTriggerButton
      )}

      {/* Основне модальне вікно */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        className={`auth-modal ${darkMode ? 'dark-theme' : ''}`}
        dialogClassName={`modal-container ${darkMode ? 'dark-theme' : ''}`}
      >
        {renderModalContent()}
      </Modal>

      {/* Модальне вікно для скидання пароля */}
      <Modal
        show={showForgotPassword}
        onHide={() => setShowForgotPassword(false)}
        centered
        className={`auth-modal ${darkMode ? 'dark-theme' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>{language === "uk" ? "Скидання пароля" : "Password Reset"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{language === "uk" ? "Ваша пошта" : "Your Email"}</Form.Label>
            <Form.Control
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              placeholder={language === "uk" ? "Введіть вашу пошту" : "Enter your email"}
            />
          </Form.Group>
          {errors.apiError && <Alert variant="danger">{errors.apiError}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForgotPassword(false)}>
            {language === "uk" ? "Скасувати" : "Cancel"}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleForgotPassword}
            disabled={isLoading}
          >
            {isLoading ? (language === "uk" ? "Відправка..." : "Sending...") : 
            (language === "uk" ? "Надіслати інструкції" : "Send Instructions")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AuthModals;