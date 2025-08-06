import { Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const HomePage = ({ darkMode, language }) => {
  const [cards, setCards] = useState([]);
  const { refreshCards, triggerCategoryRefresh } = useAuth();

  useEffect(() => {
    fetchCards();
  }, [refreshCards, triggerCategoryRefresh]);

  const fetchCards = async () => {
    try {
      const response = await axios.get("/api/content/cards", {
        headers: { "Cache-Control": "no-cache" },
      });
      const cardsData = response.data.cards;
      if (Array.isArray(cardsData)) {
        console.log("Fetched cards:", cardsData.map(card => ({ id: card._id, image: card.image, link: card.link })));
        const validCards = cardsData.filter(
          (card) =>
            card.title &&
            typeof card.title.uk === "string" &&
            typeof card.title.en === "string" &&
            card.description &&
            typeof card.description.uk === "string" &&
            typeof card.description.en === "string" &&
            (!card.category || ['accessories', 'footwear', 'clothing', 'bags'].includes(card.category))
        );
        setCards(validCards);
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      setCards([]);
    }
  };

  return (
    <div className={`homepage-wrapper ${darkMode ? "dark" : ""}`}>
      <Container>
        <div className="card-container">
          {cards.length === 0 ? (
            <div className="text-center py-5">
              <h4>{language === 'uk' ? 'Немає карток для відображення' : 'No cards to display'}</h4>
            </div>
          ) : (
            cards.map((card, index) => (
              <div className="card-wrapper" key={card._id || card.id || `${index}-${language}`}>
                <Link 
                  to={card.link && card.link !== '' ? card.link : "#"} // Використовуємо card.link
                  className="card-box"
                  onClick={(e) => {
                    if (!card.link || card.link === '') {
                      e.preventDefault(); // Забороняємо перехід, якщо посилання порожнє
                    }
                    console.log("Navigating to:", card.link || "#");
                  }}
                >
                  <img
                    src={card.image || "/placeholder.svg"}
                    alt={card.title?.[language] || "No title"}
                    className="card-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="card-overlay">
                    <h2>{card.title?.[language] || "No title"}</h2>
                  </div>
                  <div className="card-border">
                    <span></span>
                  </div>
                  <div className={`card-description ${darkMode ? "dark-description" : ""}`}>
                    {card.description?.[language] || "No description available"}
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </Container>
    </div>
  );
};

export default HomePage;