import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage";
import ProductPage from "./components/ProductPage";
import CategoriesPage from "./components/CategoriesPage";
import Module from "./components/Module";
import { AuthProvider } from "./context/AuthContext";
import VerifyEmail from "./components/VerifyEmail";
import EmailVerifiedSuccess from "./components/EmailVerifiedSuccess";
import VerifyFailed from "./components/VerifyFailed";
import Profile from "./components/Profile";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/404";
import { CartProvider } from "./components/Cart";
import Checkout from "./components/Checkout";
import ContentEditor from "./components/ContentEditor";
import ProductDetailPage from "./components/ProductDetailPage";
import ErrorBoundary from './components/ErrorBoundary';
import "./App.css";

const ProductPageWrapper = (props) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const filters = {
    category: searchParams.get("category") || null,
    subcategory: searchParams.get("subcategory") || null,
    brand: searchParams.get("brand") || null,
    color: searchParams.get("color") || null,
    material: searchParams.get("material") || null,
    country: searchParams.get("country") || null,
    waterproof: searchParams.get("waterproof") === "true",
    isNewPrice: searchParams.get("isNewPrice") === "true" ? true : null,
    isSale: searchParams.get("isSale") === "true" ? true : null,
  };

  // Додаємо перевірку на isSale
  if (
    searchParams.get("query") ||
    location.state?.searchResults ||
    filters.isNewPrice ||
    filters.isSale // <-- ДОДАНО
  ) {
    return <ProductPage {...props} filters={filters} />;
  }
  return filters.category ? (
    <ProductPage {...props} filters={filters} />
  ) : (
    <CategoriesPage {...props} />
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage ? savedLanguage : "uk";
  });

  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("bg-dark", darkMode);
    document.body.classList.toggle("text-white", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleLanguage = () => {
    setLanguage(language === "uk" ? "en" : "uk");
  };

  return (
    <AuthProvider>
      <CartProvider darkMode={darkMode} language={language}>
        <Router>
          <div className="App">
            <Header
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              language={language}
              toggleLanguage={toggleLanguage}
              setShowEditor={setShowEditor}
            />
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <HomePage language={language} darkMode={darkMode} />
                    <ErrorBoundary>
                      <Module language={language} darkMode={darkMode} />
                    </ErrorBoundary>
                  </>
                }
              />
              <Route
                path="/products"
                element={<ProductPageWrapper language={language} darkMode={darkMode} />}
              />
              <Route
                path="/products/:id"
                element={<ProductDetailPage language={language} darkMode={darkMode} />}
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile language={language} darkMode={darkMode} />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                path="/email-verified-success"
                element={<EmailVerifiedSuccess darkMode={darkMode} language={language} />}
              />
              <Route
                path="/verify-failed"
                element={<VerifyFailed darkMode={darkMode} language={language} />}
              />
              <Route
                path="/reset-password"
                element={<ResetPassword darkMode={darkMode} language={language} />}
              />
              <Route
                path="*"
                element={<NotFound darkMode={darkMode} language={language} />}
              />
              <Route
                path="/checkout"
                element={<Checkout darkMode={darkMode} language={language} />}
              />
            </Routes>
            <Footer darkMode={darkMode} language={language} />
            <ContentEditor
              show={showEditor}
              onHide={() => setShowEditor(false)}
              darkMode={darkMode}
              language={language}
            />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;