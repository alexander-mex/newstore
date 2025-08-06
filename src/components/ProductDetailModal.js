import React, { useState, useContext } from "react";
import { Modal, Button, Carousel, Row, Col, Badge, ListGroup, Form, Alert } from "react-bootstrap";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "../styles/ProductDetailModal.css";

function ProductDetailModal({ show, onHide, product, darkMode, language, onProductUpdate, products, currentIndex, onAddToCart }) {
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingReview, setEditingReview] = useState(null);
  const { user } = useContext(AuthContext);

  if (!product) return null;

  const {
    images = [],
    name,
    description,
    detailedDescription,
    oldPrice,
    newPrice,
    rating = 0,
    reviews = [],
    brand,
    category,
    subcategory,
    features = {},
    sizes = [],
    colors = [],
    season,
    gender,
    countryOfOrigin
  } = product;

  const hasDiscount = oldPrice && oldPrice > newPrice;

  const getText = (uk, en) => (language === "uk" ? uk : en);

  const getLocalizedText = (textObj) => {
    if (!textObj) return "";
    if (typeof textObj === 'string') return textObj;
    if (textObj.uk || textObj.en) return textObj[language] || textObj.uk || textObj.en || "";
    return "";
  };

  const getBrandName = (brand) => {
    const brands = [];
    return brands[brand] || brand;
  };

  const getCategoryName = (category) => {
    return getText(
      category === 'watches' ? 'Годинники' :
      category === 'footwear' ? 'Взуття' :
      category === 'clothing' ? 'Одяг' :
      category === 'hats' ? 'Шапки' :
      category === 'bags' ? 'Сумки' :
      category
    );
  };

  const getSubcategoryName = (subcategory) => {
    if (!subcategory) return "";
    
    // Якщо підкатегорія - це об'єкт з мовними варіантами
    if (typeof subcategory === 'object' && (subcategory.uk || subcategory.en)) {
      return language === "uk" ? subcategory.uk : subcategory.en || subcategory.uk;
    }
    
    // Якщо підкатегорія - це рядок, просто повертаємо його
    return subcategory;
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    onAddToCart(product);
  };

  const handlePrevProduct = () => {
    if (currentIndex > 0) {
      const prevProduct = products[currentIndex - 1];
      onProductUpdate(prevProduct, currentIndex - 1);
    }
  };

  const handleNextProduct = () => {
    if (currentIndex < products.length - 1) {
      const nextProduct = products[currentIndex + 1];
      onProductUpdate(nextProduct, currentIndex + 1);
    }
  };

  const navArrowStyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    width: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    opacity: 0.8,
    zIndex: 1000
  };

  const leftArrowStyle = {
    ...navArrowStyle,
    left: '-50px'
  };

  const rightArrowStyle = {
    ...navArrowStyle,
    right: '-50px'
  };

  const arrowDisabledStyle = {
    opacity: 0.3,
    cursor: 'not-allowed'
  };

  const startEditReview = (review) => {
    setEditingReview(review._id);
    setReviewText(review.text);
    setReviewRating(review.rating);
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setReviewText("");
    setReviewRating(0);
  };

  const handleAddReview = async () => {
    if (!reviewText || reviewRating === 0) {
      setError(getText("Будь ласка, заповніть текст та поставте рейтинг", "Please fill the review text and set rating"));
      return;
    }

    try {
      let response;
      if (editingReview) {
        response = await axios.put(`/api/products/${product._id}/reviews/${editingReview}`, {
          text: reviewText,
          rating: reviewRating
        });
      } else {
        response = await axios.post(`/api/products/${product._id}/reviews`, {
          userId: user._id,
          userName: user.name,
          text: reviewText,
          rating: reviewRating
        });
      }

      onProductUpdate(response.data);
      setReviewText("");
      setReviewRating(0);
      setEditingReview(null);
      setError("");
      setSuccess(getText(editingReview ? "Відгук оновлено успішно!" : "Відгук додано успішно!",
                        editingReview ? "Review updated successfully!" : "Review added successfully!"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getText("Помилка при збереженні відгуку", "Error saving review"));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await axios.delete(`/api/products/${product._id}/reviews/${reviewId}`);
      onProductUpdate(response.data);
      setSuccess(getText("Відгук видалено успішно!", "Review deleted successfully!"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(getText("Помилка при видаленні відгуку", "Error deleting review"));
    }
  };

  const renderStarRating = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? "filled" : ""}`}
          >
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      dialogClassName={darkMode ? "modal-dark" : "modal-light"}
      contentClassName="product-detail-modal"
    >
      <div
        style={{
          ...leftArrowStyle,
          ...(currentIndex === 0 ? arrowDisabledStyle : {}),
          ...(darkMode ? { backgroundColor: 'rgba(43, 45, 66, 0.2)' } : {})
        }}
        onClick={currentIndex > 0 ? handlePrevProduct : null}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#B80000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div
        style={{
          ...rightArrowStyle,
          ...(currentIndex === products.length - 1 ? arrowDisabledStyle : {}),
          ...(darkMode ? { backgroundColor: 'rgba(43, 45, 66, 0.2)' } : {})
        }}
        onClick={currentIndex < products.length - 1 ? handleNextProduct : null}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="#B80000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <Modal.Header closeButton className={darkMode ? "modal-header-dark" : ""}>
        <Modal.Title>{getLocalizedText(name)}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={`product-modal-body ${darkMode ? "bg-dark" : ""}`}>
        <Row className="product-row">
          <Col md={6}>
            <div className="product-gallery">
              {hasDiscount && (
                <div className="sale-badge">
                  {getText("Акційна ціна!", "Sale!")}
                </div>
              )}
              <Carousel>
                {images.map((img, index) => (
                  <Carousel.Item key={index}>
                    <img
                      src={`http://localhost:5000${img}`}
                      alt={`${getLocalizedText(name)} ${index + 1}`}
                      onError={(e) => { e.target.onerror = null; e.target.src = "path/to/placeholder-image.jpg"; }}
                    />
                  </Carousel.Item>
                ))}
              </Carousel>
            </div>
          </Col>
          <Col md={6}>
            <div className="product-info">
              <div className="product-price">
                {oldPrice && <del className="me-2">{oldPrice.toFixed(2)} ₴</del>}
                <strong>{newPrice.toFixed(2)} ₴</strong>
              </div>

              <div className="product-rating">
                <span className="rating-stars">
                  {"★".repeat(Math.floor(rating))}
                  {rating % 1 >= 0.5 ? "½" : ""}
                </span>
                <span>
                  ({reviews.length} {getText("відгуків", "reviews")})
                </span>
              </div>

              <div className="product-details">
                {brand && <Badge bg="secondary" className="me-1">
                  {getBrandName(brand)}
                </Badge>}
                {category && <Badge bg="info" className="me-1">
                  {getCategoryName(category)}
                </Badge>}
                {subcategory && <Badge bg="primary" className="me-1"> 
                  {getSubcategoryName(subcategory)}
                </Badge>}
              </div>

              {(season || gender) && !['phones', 'tvs', 'laptops'].includes(category) && (
                <div className="product-attributes">
                  {season && (
                    <Badge bg="light" text="dark" className="me-1">
                      {getText(
                        season === 'winter' ? 'Зима' :
                        season === 'spring' ? 'Весна' :
                        season === 'summer' ? 'Літо' :
                        season === 'autumn' ? 'Осінь' : 'Усесезон'
                      )}
                    </Badge>
                  )}
                  {gender && (
                    <Badge bg="light" text="dark">
                      {getText(
                        gender === 'male' ? 'Чоловіче' :
                        gender === 'female' ? 'Жіноче' :
                        gender === 'kids' ? 'Дитяче' : 'Унісекс'
                      )}
                    </Badge>
                  )}
                </div>
              )}

              {description && (
                <div className="product-short-description">
                  <h4>{getText("Опис", "Description")}</h4>
                  <p>{getLocalizedText(description)}</p>
                </div>
              )}

              {(sizes.length > 0 || colors.length > 0) && (
                <div className="product-variants">
                  {sizes.length > 0 && (
                    <div className="size-variants">
                      <strong>{getText("Розміри:", "Sizes:")}</strong>
                      <div className="size-badges">
                        {sizes.map(size => (
                          <Badge key={size} bg="light" text="dark" className="me-1">
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                    {colors.length > 0 && (
                      <div className="color-variants mt-2">
                        <strong>{getText("Колір:", "Color:")}</strong>
                        <div className="color-badges">
                          {colors.map((colors, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1">
                              {getLocalizedText(colors)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {features && Object.keys(features).length > 0 && (
                <div className="product-features">
                  <h4>{getText("Характеристики", "Features")}</h4>
                  <ListGroup variant="flush">
                    {features.material && (
                      <ListGroup.Item>
                        <strong>{getText("Матеріал:", "Material:")}</strong> {getLocalizedText(features.material)}
                      </ListGroup.Item>
                    )}
                    {features.waterproof && (
                      <ListGroup.Item>
                        {getText("Водонепроникний", "Waterproof")}
                      </ListGroup.Item>
                    )}
                    {features.warranty && (
                      <ListGroup.Item>
                        <strong>{getText("Гарантія:", "Warranty:")}</strong> {features.warranty} {getText("місяців", "months")}
                      </ListGroup.Item>
                    )}
                    {countryOfOrigin && (
                      <ListGroup.Item>
                        <strong>{getText("Країна походження:", "Country of Origin:")}</strong> {getLocalizedText(countryOfOrigin)}
                      </ListGroup.Item>
                    )}

                    {features.screenSize && (
                      <ListGroup.Item>
                        <strong>{getText("Розмір екрану:", "Screen Size:")}</strong> {features.screenSize}"
                      </ListGroup.Item>
                    )}
                    {features.storage && (
                      <ListGroup.Item>
                        <strong>{getText("Пам'ять:", "Storage:")}</strong> {features.storage}
                      </ListGroup.Item>
                    )}
                    {features.processor && (
                      <ListGroup.Item>
                        <strong>{getText("Процесор:", "Processor:")}</strong> {features.processor}
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </div>
              )}

              <div className="product-button-container">
                <Button
                  className="product-button"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAddedToCart}
                >
                  {isAddedToCart ? getText("Додано до кошика", "Added to Cart") : getText("Додати до кошика", "Add to Cart")}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {detailedDescription && (
          <div className="product-description">
            <h4>{getText("Детальний опис", "Detailed Description")}</h4>
            <div className="product-detailed-description">
              <p>{getLocalizedText(detailedDescription)}</p>
            </div>
          </div>
        )}
        {user && (
          <div className="add-review-section">
            <h4>{editingReview ? getText("Редагувати відгук", "Edit Review") : getText("Залишити відгук", "Leave a Review")}</h4>
            <Form.Group className="mb-3">
              <Form.Label>{getText("Ваш рейтинг", "Your Rating")}</Form.Label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || reviewRating) ? "filled" : ""}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{getText("Ваш відгук", "Your Review")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="mb-3"
              />
            </Form.Group>
            <div className="review-form-actions">
              <button
                className="btn-submit-review"
                onClick={handleAddReview}
              >
                {editingReview ? getText("Оновити відгук", "Update Review") : getText("Надіслати відгук", "Submit Review")}
              </button>
              {editingReview && (
                <button
                  className="btn-cancel-review"
                  onClick={cancelEditReview}
                >
                  {getText("Скасувати", "Cancel")}
                </button>
              )}
            </div>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            {success && <Alert variant="success" className="mt-3">{success}</Alert>}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="product-reviews">
            <h4>{getText("Відгуки покупців", "Customer Reviews")} ({reviews.length})</h4>
            {reviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <div>
                    <span className="review-user">{review.userName}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt && review.updatedAt !== review.createdAt && (
                        <span className="review-edited-badge">
                          {getText("(редактовано)", "(edited)")}
                        </span>
                      )}
                    </span>
                  </div>
                  {(user?.isAdmin || user?._id === review.userId) && (
                    <div className="review-actions">
                      <button
                        className="btn-review btn-review-edit"
                        onClick={() => startEditReview(review)}
                      >
                        {getText("Редагувати", "Edit")}
                      </button>
                      <button
                        className="btn-review btn-review-delete"
                        onClick={() => handleDeleteReview(review._id)}
                      >
                        {getText("Видалити", "Delete")}
                      </button>
                    </div>
                  )}
                </div>
                <div className="review-rating">
                  {renderStarRating(review.rating)}
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className={darkMode ? "modal-footer-dark" : ""}>
        <Button onClick={onHide} className="btn-close-modal">
          {getText("Закрити", "Close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductDetailModal;