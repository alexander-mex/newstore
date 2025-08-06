import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Alert, Image, Form } from "react-bootstrap";
import axios from "axios";
import { useCart } from "./Cart";
import { useAuth } from "../context/AuthContext";
import "../styles/ProductDetailPage.css";

function ProductDetailPage({ darkMode, language }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart } = useCart();
  const { user, isAdmin } = useAuth();
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [editingReview, setEditingReview] = useState(null);
  const [success, setSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  const renderSizes = (sizes) => {
    if (!sizes) return "N/A";
    return sizes;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || id === "undefined") {
        setError(language === "uk" ? "Невалідний ідентифікатор товару" : "Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`https://newstore-sepia.vercel.app/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (err) {
        setError(language === "uk" ? "Помилка завантаження товару" : "Error loading product");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, language]);

  const getText = (uk, en) => (language === "uk" ? uk : en);
  const getLocalizedText = (textObj) => {
    if (!textObj) return "";
    if (typeof textObj === "string") return textObj;
    if (textObj.uk || textObj.en) return textObj[language] || textObj.uk || textObj.en || "";
    return "";
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    addToCart(product);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handleImageClick = (image) => {
    setZoomedImage(image);
    setShowZoomModal(true);
  };

  const handleCloseModal = () => {
    setShowZoomModal(false);
    setZoomedImage("");
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
      setReviewError(getText("Будь ласка, заповніть текст та поставте рейтинг", "Please fill the review text and set rating"));
      return;
    }

    if (!user || !user.id) {
      setReviewError(getText("Користувач не авторизований", "User is not authenticated"));
      return;
    }

    if (!product || !product._id) {
      setReviewError(getText("Товар не знайдено", "Product not found"));
      return;
    }

    try {
      let response;
      if (editingReview) {
        response = await axios.put(`https://newstore-sepia.vercel.app/api/products/${product._id}/reviews/${editingReview}`, {
          text: reviewText,
          rating: reviewRating,
        });
      } else {
        response = await axios.post(`https://newstore-sepia.vercel.app/api/products/${product._id}/reviews`, {
          userId: user.id,
          userName: user.name,
          text: reviewText,
          rating: reviewRating,
        });
      }

      setProduct(response.data);
      setReviewText("");
      setReviewRating(0);
      setEditingReview(null);
      setReviewError("");
      setSuccess(getText(
        editingReview ? "Відгук оновлено успішно!" : "Відгук додано успішно!",
        editingReview ? "Review updated successfully!" : "Review added successfully!"
      ));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setReviewError(getText("Помилка при збереженні відгуку", "Error saving review"));
      console.error("Save review error:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      if (!product?._id || !reviewId) {
        setReviewError(getText("Не вдалося ідентифікувати продукт або відгук", "Failed to identify product or review"));
        return;
      }
  
      const response = await axios.delete(
        `https://newstore-sepia.vercel.app/api/products/${product._id}/reviews/${reviewId}`
      );
  
      if (response.data && response.data._id) {
        setProduct(response.data);
        setSuccess(getText("Відгук видалено успішно!", "Review deleted successfully!"));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setReviewError(getText("Помилка при видаленні відгуку", "Error deleting review"));
      }
    } catch (err) {
      console.error("Delete review error:", err);
      setReviewError(
        getText(
          `Помилка при видаленні відгуку: ${err.response?.data?.message || err.message}`,
          `Error deleting review: ${err.response?.data?.message || err.message}`
        )
      );
    }
  };

  const renderStarRating = (rating) => (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? "filled" : ""}`}
          onClick={() => setReviewRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {star <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          {getText("Товар не знайдено", "Product not found")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className={`py-4 product-detail-page ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <Button
        variant={darkMode ? "outline-light" : "outline-primary"}
        onClick={() => navigate(-1)}
        className="mb-4 back-button"
      >
        {getText("Назад до списку товарів", "Back to products")}
      </Button>

      <Row className="product-row">
        <Col md={6}>
          <div className="product-gallery">
            {product.images && product.images.length > 0 ? (
              <div className="product-slider">
                <div
                  className="slider-container"
                  style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                >
                  {product.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`${getLocalizedText(product.name)} ${index + 1}`}
                      className="slider-image"
                      onClick={() => handleImageClick(image)}
                    />
                  ))}
                </div>
                {product.images.length > 1 && (
                  <>
                    <button className="slider-nav prev" onClick={handlePrevImage}>
                      ❮
                    </button>
                    <button className="slider-nav next" onClick={handleNextImage}>
                      ❯
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p>{getText("Зображення відсутні", "No images available")}</p>
            )}
          </div>
        </Col>
        <Col md={6}>
          <div className="product-info">
            <h2>{getLocalizedText(product.name)}</h2>
            <p>
              <strong>{getText("Категорія:", "Category:")}</strong> {getText(
                product.category === 'accessories' ? 'Аксесуари' :
                product.category === 'footwear' ? 'Взуття' :
                product.category === 'clothing' ? 'Одяг' :
                product.category === 'bags' ? 'Сумки' : product.category
              )}
            </p>
            <p>
              <strong>{getText("Бренд:", "Brand:")}</strong> {product.brand}
            </p>
            {product.features?.isNewPrice && (
              <p>
                <strong>{getText("Новинка:", "New:")}</strong> {getText("Так", "Yes")}
              </p>
            )}
            {product.newPrice && (
              <p>
                <strong>{getText("Ціна:", "Price:")}</strong>{" "}
                <span className="price-highlight">{product.newPrice} {getText("грн", "UAH")}</span>
                {product.oldPrice && product.oldPrice > product.newPrice && (
                  <span className="text-muted ms-2 old-price">
                    <del>{product.oldPrice} {getText("грн", "UAH")}</del>
                  </span>
                )}
              </p>
            )}
            {product.rating > 0 && (
              <div>
                <strong>{getText("Рейтинг:", "Rating:")}</strong> {renderStarRating(product.rating)} ({product.rating}/5)
              </div>
            )}
            {product.description && (
              <p>
                <strong>{getText("Опис:", "Description:")}</strong>{" "}
                {getLocalizedText(product.description)}
              </p>
            )}
            {product.detailedDescription && (
              <p>
                <strong>{getText("Детальний опис:", "Detailed Description:")}</strong>{" "}
                {getLocalizedText(product.detailedDescription)}
              </p>
            )}
            {product.colors && (
              <p>
                <strong>{getText("Кольори:", "Colors:")}</strong>{" "}
                {getLocalizedText(product.colors)}
              </p>
            )}
            {product.sizes && (
              <p>
                <strong>{getText("Розміри:", "Sizes:")}</strong>{" "}
                {renderSizes(product.sizes)}
              </p>
            )}
            {product.features?.material && (
              <p>
                <strong>{getText("Матеріал:", "Material:")}</strong>{" "}
                {getLocalizedText(product.features.material)}
              </p>
            )}
            {product.countryOfOrigin && (
              <p>
                <strong>{getText("Країна походження:", "Country of Origin:")}</strong>{" "}
                {getLocalizedText(product.countryOfOrigin)}
              </p>
            )}
            <Button
              className="product-button mt-3"
              size="lg"
              onClick={handleAddToCart}
              disabled={isAddedToCart}
            >
              {isAddedToCart
                ? getText("Додано до кошика", "Added to Cart")
                : getText("Додати до кошика", "Add to Cart")}
            </Button>
          </div>
        </Col>
      </Row>

      {user && (
        <div className="add-review-section mt-5">
          <h4 className="section-title">{editingReview ? getText("Редагувати відгук", "Edit Review") : getText("Залишити відгук", "Leave a Review")}</h4>
          <div className="review-form-container">
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
                    style={{ cursor: 'pointer' }}
                  >
                    {star <= (hoverRating || reviewRating) ? "★" : "☆"}
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
                className="review-textarea"
                placeholder={getText("Напишіть ваш відгук...", "Write your review...")}
              />
            </Form.Group>
            <div className="review-form-actions">
              <Button onClick={handleAddReview} className="product-button me-2">
                {editingReview ? getText("Оновити відгук", "Update Review") : getText("Надіслати відгук", "Submit Review")}
              </Button>
              {editingReview && (
                <Button variant="secondary" onClick={cancelEditReview} className="cancel-button">
                  {getText("Скасувати", "Cancel")}
                </Button>
              )}
            </div>
            {reviewError && <Alert variant="danger" className="mt-3">{reviewError}</Alert>}
            {success && <Alert variant="success" className="mt-3">{success}</Alert>}
          </div>
        </div>
      )}

      {product.reviews?.length > 0 && (
        <div className="product-reviews mt-5">
          <h4 className="section-title">{getText("Відгуки покупців", "Customer Reviews")} ({product.reviews.length})</h4>
          <div className="reviews-container">
            {product.reviews.map((review) => (
              <div key={review._id || review.userId + review.createdAt} className="review-item">
                <div className="review-header">
                  <div>
                    <span className="review-user">{review.userName}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt && review.updatedAt !== review.createdAt && (
                        <span className="review-edited-badge">
                          {getText("(редаговано)", "(edited)")}
                        </span>
                      )}
                    </span>
                  </div>
                  {(isAdmin || user?._id === review.userId) && (
                    <div className="review-actions">
                      <Button variant="button" onClick={() => startEditReview(review)} className="review-action-btn btn">
                        {getText("Редагувати", "Edit")}
                      </Button>
                      <Button variant="button" onClick={() => handleDeleteReview(review._id)} className="review-action-btn delete">
                        {getText("Видалити", "Delete")}
                      </Button>
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
        </div>
      )}

      {showZoomModal && (
        <div className="zoom-modal" onClick={handleCloseModal}>
          <button className="close-modal" onClick={handleCloseModal}>✕</button>
          <img src={zoomedImage} alt="Zoomed product" className="zoom-image" />
        </div>
      )}
    </Container>
  );
}

export default ProductDetailPage;