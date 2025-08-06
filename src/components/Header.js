import React, { useState, useEffect } from "react";
import { Navbar, Form, FormControl, Button, Modal } from "react-bootstrap";
import axios from 'axios';
import { useCart } from './Cart';
import { useAuth } from '../context/AuthContext';
import AuthModals from "./AuthModals";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Header = ({
  darkMode,
  toggleDarkMode,
  language,
  toggleLanguage,
  setShowEditor
}) => {
  const { user, isAdmin, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { CartComponent } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  if (isLoading) {
    return null;
  }

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setModalMessage(language === "uk" ? "Введіть пошуковий запит" : "Enter a search query");
      setShowModal(true);
      return;
    }
  
    try {
      const response = await axios.get('/api/products/search', {
        params: { query: searchQuery }
      });
      if (response.data.length === 0) {
        setModalMessage(language === "uk" ? "Нічого не знайдено" : "No results found");
        setShowModal(true);
      } else {
        navigate(`/products?query=${encodeURIComponent(searchQuery)}`, {
          state: { searchResults: response.data, query: searchQuery }
        });
      }
    } catch (error) {
      console.error('Error during search:', error);
      setModalMessage(language === "uk" ? "Помилка пошуку" : "Search error");
      setShowModal(true);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <Navbar
        bg={darkMode ? "dark" : "light"}
        variant={darkMode ? "dark" : "light"}
        expand="lg"
        className="custom-header-container"
      >
        <div className="custom-desktop-grid">
          <div className="custom-logo-section">
            <div className="custom-logo-wrapper" onClick={handleLogoClick}>
              <img
                src="/logo.png"
                alt="Logo"
                className="custom-header-logo"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="custom-logo-text" style={{ display: "none" }}>
                {language === "uk" ? "Магазин" : "Shop"}
              </span>
            </div>
          </div>

          <div className="custom-search-section">
            <Form className="custom-search-form" onSubmit={handleSearch}>
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                href="/products"
                className="custom-catalog-btn"
              >
                {language === "uk" ? "Каталог" : "Catalog"}
              </Button>
              <FormControl
                type="text"
                placeholder={language === "uk" ? "Пошук" : "Search"}
                className="custom-search-input"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-success" type="submit" className="custom-search-btn">
                <i className="bi bi-search"></i>
              </Button>
            </Form>
          </div>

          <div className="custom-controls-section">
            <div className="custom-toggle-group">
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={toggleDarkMode}
                className="custom-toggle-dark"
              >
                <i className={darkMode ? "bi bi-brightness-high" : "bi bi-moon-stars"}></i>
              </Button>
              <Button
                variant={darkMode ? "outline-light" : "outline-dark"}
                onClick={toggleLanguage}
                className="custom-toggle-lang"
              >
                {language === "uk" ? "UA" : "EN"}
              </Button>
            </div>
            <div className="custom-auth-cart">
              {CartComponent}
              {isAdmin && (
                <Button
                  onClick={() => setShowEditor(true)}
                  className="custom-edit-btn"
                >
                  <i className="bi bi-pencil-square"></i>
                  {language === "uk" ? "Редагувати" : "Edit"}
                </Button>
              )}
              <AuthModals darkMode={darkMode} language={language} isAuthenticated={!!user} />
            </div>
          </div>
        </div>

        <div className="custom-mobile-view">
          <div className="custom-mobile-header">
            <div className="custom-mobile-logo" onClick={handleLogoClick}>
              <img
                src="/logo.png"
                alt="Logo"
                className="custom-mobile-logo-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="custom-mobile-logo-text" style={{ display: "none" }}>
                {language === "uk" ? "Магазин" : "Shop"}
              </span>
            </div>
            <Form className="custom-mobile-search-form" onSubmit={handleSearch}>
              <FormControl
                type="text"
                placeholder={language === "uk" ? "Пошук" : "Search"}
                className="custom-mobile-search-input"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="outline-success" type="submit" className="custom-mobile-search-btn">
                <i className="bi bi-search"></i>
              </Button>
            </Form>
            <Button
              variant={darkMode ? "outline-light" : "outline-dark"}
              onClick={toggleMobileMenu}
              className="custom-burger-btn"
            >
              <i className="bi bi-list"></i>
            </Button>
          </div>

          {mobileMenuOpen && (
            <>
              <div
                className="custom-mobile-backdrop"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="custom-mobile-menu">
                <Button
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  href="/products"
                  className="custom-mobile-catalog-btn"
                >
                  <i className="bi bi-grid"></i>
                  {language === "uk" ? "Каталог" : "Catalog"}
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => setShowEditor(true)}
                    className="custom-mobile-edit-btn"
                  >
                    <i className="bi bi-pencil-square"></i>
                    {language === "uk" ? "Редагувати" : "Edit"}
                  </Button>
                )}
                <AuthModals
                  darkMode={darkMode}
                  language={language}
                  isAuthenticated={!!user}
                  mobileView={true}
                  triggerButton={
                    <Button
                      variant={darkMode ? "outline-light" : "outline-dark"}
                      className="custom-mobile-auth-btn"
                    >
                      <i className="bi bi-person"></i>
                      {language === "uk" ? "Профіль" : "Profile"}
                    </Button>
                  }
                />
                <Button
                  variant={darkMode ? "outline-light" : "outline-dark"}
                  className="custom-mobile-cart-btn"
                >
                  <i className="bi bi-cart"></i>
                  {language === "uk" ? "Кошик" : "Cart"}
                </Button>
                <div className="custom-mobile-toggles">
                  <Button
                    variant={darkMode ? "outline-light" : "outline-dark"}
                    onClick={toggleDarkMode}
                    className="custom-mobile-toggle-dark"
                  >
                    <i className={darkMode ? "bi bi-brightness-high" : "bi bi-moon-stars"}></i>
                    {darkMode ? (language === "uk" ? "Світлий режим" : "Light mode") : (language === "uk" ? "Темний режим" : "Dark mode")}
                  </Button>
                  <Button
                    variant={darkMode ? "outline-light" : "outline-dark"}
                    onClick={toggleLanguage}
                    className="custom-mobile-toggle-lang"
                  >
                    <i className="bi bi-translate"></i>
                    {language === "uk" ? "English" : "Українська"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Navbar>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        className={`custom-modal ${darkMode ? "custom-dark-modal" : ""}`}
      >
        <Modal.Header closeButton className={darkMode ? "custom-modal-header-dark" : "custom-modal-header"}>
          <Modal.Title>{language === "uk" ? "Повідомлення" : "Message"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={darkMode ? "custom-modal-body-dark" : "custom-modal-body"}>
          {modalMessage}
        </Modal.Body>
        <Modal.Footer className={darkMode ? "custom-modal-footer-dark" : "custom-modal-footer"}>
          <Button variant={darkMode ? "outline-light" : "outline-dark"} onClick={handleCloseModal} className="custom-modal-close">
            {language === "uk" ? "Закрити" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Header;