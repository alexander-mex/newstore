import React, { useEffect, useState } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const carousel = (slider) => {
  const slideCount = slider.slides.length;
  const degPerSlide = 360 / slideCount;

  function getZTranslation() {
    if (window.innerWidth >= 1300) return 600;
    if (window.innerWidth >= 1200) return 400;
    if (window.innerWidth >= 992) return 400;
    if (window.innerWidth >= 768) return 300;
    if (window.innerWidth >= 576) return 250;
    if (window.innerWidth >= 480) return 225;
    if (window.innerWidth >= 360) return 200;
    return 250;
  }

  function rotate() {
    const currentIndex = slider.track.details.abs;
    const rotation = degPerSlide * currentIndex;
    const z = getZTranslation();
    slider.container.style.transform = `translateZ(-${z - 200}px) rotateY(-${rotation}deg)`;
  }

  slider.on("created", () => {
    const z = getZTranslation();
    slider.slides.forEach((element, idx) => {
      element.style.setProperty('--cell-rotation', `${degPerSlide * idx}deg`);
      element.style.transform = `rotateY(${degPerSlide * idx}deg) translateZ(${z}px)`;
    });
    rotate();
  });

  slider.on("detailsChanged", rotate);
};

const ModuleSlider = ({ language = "uk", darkMode = false }) => {
  const [cardData, setCardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const translations = {
    new: { uk: "Новинка", en: "New" },
    sale: { uk: "Знижка", en: "Sale" },
  };

  useEffect(() => {
    const fetchModuleCards = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/content/module-cards');
        const normalizedCards = (response.data.cards || []).map(card => ({
          ...card,
          newPrice: {
            uk: card.newPrice?.uk || '',
            en: card.newPrice?.en || card.newPrice?.uk || '',
          },
          oldPrice: {
            uk: card.oldPrice?.uk || '',
            en: card.oldPrice?.en || card.oldPrice?.uk || '',
          },
          title: {
            uk: card.title?.uk || '',
            en: card.title?.en || card.title?.uk || '',
          },
          description: {
            uk: card.description?.uk || '',
            en: card.description?.en || card.description?.uk || '',
          },
          category: ['accessories', 'footwear', 'clothing', 'bags'].includes(card.category)
            ? card.category
            : undefined,
        }));
        setCardData(normalizedCards);
      } catch (error) {
        console.error('Error fetching module cards:', error);
        setCardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleCards();
  }, []);

  const [sliderRef] = useKeenSlider(
    {
      loop: true,
      selector: ".carousel__cell",
      renderMode: "custom",
      mode: "snap",
      rubberband: false,
      dragSpeed: 0.8,
      defaultAnimation: {
        duration: 500,
        easing: t => t,
      },
    },
    [carousel]
  );

  if (loading) {
    return (
      <Container className={`modules-wrapper ${darkMode ? "dark-mode" : ""}`} fluid>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!cardData.length && isAdmin) {
    return (
      <Container className={`modules-wrapper ${darkMode ? "dark-mode" : ""}`} fluid>
        <div className="text-center py-5">
          <h4>{language === 'uk' ? 'Немає карток для відображення' : 'No cards to display'}</h4>
          <p>{language === 'uk' ? 'Ви можете додати картки через редактор контенту' : 'You can add cards via the content editor'}</p>
        </div>
      </Container>
    );
  }

  if (!cardData.length) {
    return null;
  }

  return (
    <Container className={`modules-wrapper ${darkMode ? "dark-mode" : ""}`} fluid>
      <div className="wrapper">
        <div className="scene">
          <div className="carousel keen-slider drag-area" ref={sliderRef}>
            {cardData.map((card, index) => (
              <div key={card.id || index} className="carousel__cell">
                <a
                  href={card.link}
                  rel="noopener noreferrer"
                  className={`modules-card ${darkMode ? "dark-mode" : ""}`}
                  onClick={(e) => {
                    if (!card.link) {
                      e.preventDefault();
                      console.error("Link is missing for card:", card);
                    }
                  }}
                >
                  <div className="modules-img-container">
                    <img
                      src={card.imgSrc || "/placeholder.svg"}
                      alt={card.title?.[language] || "No title"}
                      className="modules-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    {card.isNewPrice && (
                      <span className="module-badge module-new">
                        {translations.new[language]}
                      </span>
                    )}
                    {card.isSale && (
                      <span className="module-badge module-sale">
                        {translations.sale[language]}
                      </span>
                    )}
                    <div className="module-icons">
                      <i
                        className="fas fa-eye module-icon"
                        style={{ "--delay": "0.4s" }}
                      ></i>
                    </div>
                  </div>
                  <div className="modules-card-body">
                    <h3 className="modules-cardTitle">{card.title?.[language] || "No title"}</h3>
                    <p className="trands-desc">{card.description?.[language] || "No description"}</p>
                    <div className="modules-items">
                      {(card.newPrice?.uk || card.newPrice?.en || card.oldPrice?.uk || card.oldPrice?.en) && (
                        <div className="modules-itemPrice">
                          {card.newPrice?.[language] && card.newPrice[language] !== '' && (
                            <span className="modules-newPrice">
                              {card.newPrice[language]} ₴
                            </span>
                          )}
                          {card.oldPrice?.[language] && card.oldPrice[language] !== '' && (
                            <span className="modules-oldPrice">
                              {card.oldPrice[language]} ₴
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default ModuleSlider;