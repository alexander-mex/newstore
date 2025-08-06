import { Link as RouterLink } from "react-router-dom";
import "../styles/HomePage.css";
import ModuleSlider from "./ModuleSlider";

const Module = ({ language = "uk", darkMode = false }) => {
  const translations = {
    newArrivals: { uk: "Нові надходження", en: "New Arrivals" },
    topProducts: { uk: "Каталог товарів", en: "Product catalog" },
    saleProducts: { uk: "Розпродаж", en: "Sale" },
  };

  return (
    <>
      <div className={`modules-wrapper ${darkMode ? "dark-mode" : ""}`}>
        <div className="modules">
          <ul className="modules-links">
            <li className="modules-list">
              <RouterLink
                to="/products"
                className={`modules-link ${darkMode ? "dark-mode" : ""}`}
              >
                {translations.topProducts[language]}
              </RouterLink>
            </li>
            <li className="modules-list">
              <RouterLink
                to="/products?isNewPrice=true"
                className={`modules-link ${darkMode ? "dark-mode" : ""}`}
              >
                {translations.newArrivals[language]}
              </RouterLink>
            </li>
            <li className="modules-list">
              <RouterLink
                to="/products?isSale=true"
                className={`modules-link ${darkMode ? "dark-mode" : ""}`}
              >
                {translations.saleProducts[language]}
              </RouterLink>
            </li>
          </ul>
          <ModuleSlider language={language} darkMode={darkMode} />
        </div>
      </div>
    </>
  );
};

export default Module;