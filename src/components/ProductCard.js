import React from "react";
import { Button, Badge } from "react-bootstrap";
import Carousel from "react-bootstrap/Carousel";
import "../styles/ProductCard.css";
import { useAuth } from "../context/AuthContext";

function ProductCard({
  product,
  darkMode,
  language,
  onEdit,
  onDelete,
  onViewDetails,
  onAddToCart,
}) {
  const { isAdmin } = useAuth();

  const {
    _id,
    images = [],
    name,
    description,
    oldPrice,
    newPrice,
    rating = 0,
    reviews = [],
    brand,
    category,
    subcategory,
    features = {},
  } = product;

  const handleCardClick = (e) => {
    if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
      console.log("ProductCard: Clicking product:", product);
      if (!product?._id) {
        console.error("ProductCard: Missing _id:", product);
        return;
      }
      onViewDetails(product);
    }
  };

  const getLocalizedText = (textObj) => {
    if (!textObj) return "";
    if (typeof textObj === 'string') return textObj;
    if (textObj.uk || textObj.en) return textObj[language] || textObj.uk || textObj.en || "";
    return "";
  };

  const getSubcategoryName = (subcategory) => {
    if (!subcategory) return "";
    
    // Якщо підкатегорія - це об'єкт з мовними варіантами
    if (typeof subcategory === 'object' && subcategory.uk) {
      return language === "uk" ? subcategory.uk : subcategory.en || subcategory.uk;
    }
    
    // Переклади підкатегорій
    const subcategoryTranslations = {
      'smart': getText('Розумні', 'Smart'),
      'classic': getText('Класичні', 'Classic'),
      'sport': getText('Спортивні', 'Sport'),
      'boots': getText('Черевики', 'Boots'),
      'sneakers': getText('Кросівки', 'Sneakers'),
      'shoes': getText('Туфлі', 'Shoes'),
      'sandals': getText('Сандалі', 'Sandals'),
      'shirts': getText('Сорочки', 'Shirts'),
      'pants': getText('Штани', 'Pants'),
      'dresses': getText('Сукні', 'Dresses'),
      'jackets': getText('Куртки', 'Jackets'),
      'caps': getText('Кепки', 'Caps'),
      'beanies': getText('Шапки', 'Beanies'),
      'hats': getText('Капелюхи', 'Hats'),
      'backpacks': getText('Рюкзаки', 'Backpacks'),
      'handbags': getText('Сумки', 'Handbags'),
      'wallets': getText('Гаманці', 'Wallets')
    };
    
    return subcategoryTranslations[subcategory] || subcategory;
  };

  const hasDiscount = oldPrice && oldPrice > newPrice;

  const getText = (ukText, enText) => (language === "uk" ? ukText : enText);

  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="star-rating">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`star ${i < fullStars ? "filled" : ""}`}>
            {i < fullStars ? "★" : hasHalfStar && i === fullStars ? "½" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`product-card ${darkMode ? "dark-mode" : ""}`} onClick={handleCardClick}>
      {images.length > 0 && (
        <div className="product-image-container">
          {hasDiscount && (
            <div className="sale-badge">
              {getText("Акція!", "Sale!")}
            </div>
          )}
          {features?.isNewPrice && (
            <div className="new-badge">
              {getText("Новинка!", "New!")}
            </div>
          )}
          <Carousel
            className="product-carousel"
            indicators={false}
            controls={images.length > 1}
            interval={images.length > 1 ? 8000 : null}
            pause="hover"
          >
            {images.map((img, index) => (
              <Carousel.Item key={index}>
                <img
                  className="product-image"
                  src={img}
                  alt={`${getLocalizedText(name)} ${index + 1}`}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      )}

      <div className="product-card-body">
        <h5 className="product-title">{getLocalizedText(name)}</h5>
        <p className="product-description">{getLocalizedText(description)}</p>

        <div className="product-price">
          {oldPrice && <span className="old-price">{oldPrice} ₴</span>}
          <span className="new-price">{newPrice} ₴</span>
        </div>

        <div className="product-rating">
          {renderStarRating(rating)}
          <span className="rating-text">
            {rating.toFixed(1)} ({reviews.length} {getText("відгуків", "reviews")})
          </span>
        </div>

        <div className="product-details flex flex-wrap items-center gap-1">
          <Badge className="custom-badge badge-brand text-lg font-semibold shadow-md bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            {brand}
          </Badge>
          <Badge className="custom-badge badge-category">
            {getText(
              category === 'accessories' ? 'Аксесуари' :
              category === 'footwear' ? 'Взуття' :
              category === 'clothing' ? 'Одяг' :
              category === 'bags' ? 'Сумки' : category
            )}
          </Badge>
          {subcategory && (
            <Badge className="custom-badge badge-subcategory">
              {getSubcategoryName(subcategory)}
            </Badge>
          )}
          {features?.material && (
            <Badge className="custom-badge badge-material">
              {getText("Матеріал: ", "Material: ")}
              {getLocalizedText(features.material)}
            </Badge>
          )}
          {features?.waterproof && (
            <Badge className="custom-badge badge-waterproof">
              {getText("Водонепроникний", "Waterproof")}
            </Badge>
          )}
          {features?.warranty && (
            <Badge className="custom-badge badge-warranty">
              {getText("Гарантія: ", "Warranty: ")}
              {features.warranty} {getText("місяців", "month")}
            </Badge>
          )}
          {product.colors && (
            <Badge className="custom-badge badge-color">
              {getText("Колір: ", "Color: ")}
              {getLocalizedText(product.colors)}
            </Badge>
          )}
        </div>
      </div>

      <div className="product-card-footer">
        <Button
          className="product-btn btn-details w-100"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product.id);
          }}
        >
          {language === "uk" ? "Детальніше" : "View Details"}
        </Button>

        <Button
          className="product-btn btn-add-to-cart w-100"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          {getText("Додати у кошик", "Add to Cart")}
        </Button>

        {isAdmin && (
          <div className="moderator-actions">
            <Button
              className="product-btn btn-edit flex-grow-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
            >
              {getText("Редагувати", "Edit")}
            </Button>
            <Button
              className="product-btn btn-delete flex-grow-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(_id);
              }}
            >
              {getText("Видалити", "Delete")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;