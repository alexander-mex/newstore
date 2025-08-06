import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Modal, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import CategoryCard from "./CategoryCard";
import "../styles/CategoriesPage.css";

const CategoriesPage = ({ darkMode, language }) => {
  const { isAdmin, triggerCategoryRefresh } = useAuth();
  const navigate = useNavigate();
  const getText = (ua, en) => (language === "uk" ? ua : en);

  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    image: null,
    name_uk: "",
    name_en: "",
    category: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse] = await Promise.all([
          axios.get("/api/products/categories", {
            headers: { "Cache-Control": "no-cache" },
          }),
        ]);
        const categoriesData = categoriesResponse.data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error("Помилка при завантаженні даних:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [triggerCategoryRefresh]);

  const handleUpdateCategory = async (categoryId, updatedData) => {
    try {
      const formData = new FormData();
      if (updatedData.image instanceof File) {
        formData.append("image", updatedData.image);
      } else if (updatedData.image) {
        formData.append("image", updatedData.image);
      }
      formData.append("name", JSON.stringify(updatedData.name));
      formData.append("link", updatedData.link);
      formData.append("category", updatedData.category || "");

      const response = await axios.put(`/api/products/categories/${categoryId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCategories((prev) =>
        prev.map((cat) => (cat._id === categoryId ? response.data : cat))
      );
      if (triggerCategoryRefresh) {
        triggerCategoryRefresh();
      }
    } catch (error) {
      console.error("Помилка при оновленні категорії:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(`/api/products/categories/${categoryId}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      if (triggerCategoryRefresh) {
        triggerCategoryRefresh();
      }
    } catch (error) {
      console.error("Помилка при видаленні категорії:", error);
    }
  };

  const handleAddCategory = async () => {
    const { category, name_uk, name_en } = newCategoryData;

    if (!category) {
      console.error("Category is missing");
      setShowAddModal(false);
      return;
    }

    const link = `/products?category=${encodeURIComponent(category)}`;

    try {
      const formData = new FormData();
      if (newCategoryData.image) {
        formData.append("image", newCategoryData.image);
      }
      formData.append("name", JSON.stringify({
        uk: name_uk || getText("Без назви", "Untitled"),
        en: name_en || "Untitled",
      }));
      formData.append("link", link);
      formData.append("category", category);

      const response = await axios.post("/api/products/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCategories((prev) => [...prev, response.data]);
      setNewCategoryData({ image: null, name_uk: "", name_en: "", category: "" });
      setImagePreview("");
      setShowAddModal(false);
      if (triggerCategoryRefresh) {
        triggerCategoryRefresh();
      }
    } catch (error) {
      console.error("Помилка при додаванні категорії:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCategoryData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (value) => {
    if (!value) return;

    setNewCategoryData((prev) => ({
      ...prev,
      category: value,
      name_uk: getText(
        value === "watches" ? "Годинники" :
        value === "footwear" ? "Взуття" :
        value === "clothing" ? "Одяг" :
        value === "hats" ? "Шапки" :
        value === "bags" ? "Сумки" :
        value === "accessories" ? "Аксесуари" : value,
        value
      ),
      name_en: value.charAt(0).toUpperCase() + value.slice(1),
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  return (
    <Container fluid className={`py-4 main-container ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <h2 className="text-center mb-4">{getText("Каталог", "Catalog")}</h2>

      {isAdmin && (
        <div className="d-flex justify-content-end mb-4">
          <Button
            variant={darkMode ? "light" : "primary"}
            onClick={() => setShowAddModal(true)}
            className="add-category-btn"
          >
            {getText("Додати категорію", "Add Category")}
          </Button>
        </div>
      )}

      <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 px-4 category-page">
        {categories.map((category) => (
          <Col key={category._id}>
            <CategoryCard
              category={category}
              darkMode={darkMode}
              language={language}
              isAdmin={isAdmin}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center mt-4">
        <Button
          variant={darkMode ? "outline-light" : "outline-primary"}
          onClick={() => navigate("/")}
          className="btn-back-home"
        >
          {getText("На головну", "Home")}
        </Button>
      </div>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} className={darkMode ? "dark-mode" : ""}>
        <Modal.Header closeButton>
          <Modal.Title>{getText("Додати категорію", "Add Category")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formImage">
              <Form.Label>{getText("Зображення", "Image")}</Form.Label>
              <Form.Control type="file" onChange={handleImageChange} />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100%", marginTop: "10px", maxHeight: "200px", objectFit: "contain" }}
                />
              )}
            </Form.Group>
            <Form.Group controlId="formCategory" className="mt-3">
              <Form.Label>{getText("Категорія", "Category")}</Form.Label>
              <Form.Select
                value={newCategoryData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">{getText("Оберіть категорію", "Select Category")}</option>
                <option value="footwear">{getText("Взуття", "Footwear")}</option>
                <option value="clothing">{getText("Одяг", "Clothing")}</option>
                <option value="bags">{getText("Сумки", "Bags")}</option>
                <option value="accessories">{getText("Аксесуари", "Accessories")}</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            {getText("Закрити", "Close")}
          </Button>
          <Button
            variant="primary"
            onClick={handleAddCategory}
            disabled={!newCategoryData.name_uk || !newCategoryData.name_en || !newCategoryData.category}
          >
            {getText("Додати", "Add")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoriesPage;