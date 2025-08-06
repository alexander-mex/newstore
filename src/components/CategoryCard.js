import React, { useState, useEffect } from "react";
import { Card, Button, Modal, Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../styles/CategoryCard.css";

const CategoryCard = ({ category, darkMode, language, onUpdate, onDelete }) => {
  const { isAdmin } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({
    image: null,
    name_uk: category.name.uk || "",
    name_en: category.name.en || "",
    category: category.category || "",
  });
  const [imagePreview, setImagePreview] = useState(category.image || "");
  const [filterOptions, setFilterOptions] = useState({ categories: [] });

  const getText = (uk, en) => (language === "uk" ? uk : en);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get("/api/products/filters");
        setFilterOptions({
          categories: response.data.categories || [],
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  const handleEdit = () => {
    setEditData({
      image: null,
      name_uk: category.name.uk || "",
      name_en: category.name.en || "",
      category: category.category || "",
    });
    setImagePreview(category.image || "");
    setShowEditModal(true);
  };

  const handleSave = () => {
    const updatedData = {
      name: { uk: editData.name_uk, en: editData.name_en },
      category: editData.category,
    };
    if (editData.image) {
      updatedData.image = editData.image;
    } else {
      updatedData.image = category.image;
    }
    onUpdate(category._id, updatedData);
    setShowEditModal(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(category._id);
    setShowDeleteModal(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (value) => {
    setEditData({ ...editData, category: value });
  };

  return (
    <>
      <Card className={`category-card ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}>
        <Card.Img
          variant="top"
          src={category.image || "/placeholder.png"}
          alt={getText(category.name.uk, category.name.en)}
        />
        <Card.Body className="d-flex flex-column align-items-center">
          <Card.Title>{getText(category.name.uk, category.name.en)}</Card.Title>
          <Button
            variant={darkMode ? "outline-light" : "outline-primary"}
            href={`/products?category=${category.category}`}
            className="mt-2 btn-look"
          >
            {getText("Переглянути", "View")}
          </Button>
          {isAdmin && (
            <div className="admin-btn-group">
              <Button variant="warning" onClick={handleEdit} className="mt-2">
                {getText("Редагувати", "Edit")}
              </Button>
              <Button variant="danger" onClick={handleDelete} className="mt-2">
                {getText("Видалити", "Delete")}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} className={darkMode ? "dark-mode" : ""}>
        <Modal.Header closeButton>
          <Modal.Title>{getText("Редагувати категорію", "Edit Category")}</Modal.Title>
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
            <Form.Group controlId="formNameUk" className="mt-3">
              <Form.Label>{getText("Назва (UA)", "Name (UA)")}</Form.Label>
              <Form.Control
                type="text"
                value={editData.name_uk}
                onChange={(e) => setEditData((prev) => ({ ...prev, name_uk: e.target.value }))}
              />
            </Form.Group>
            <Form.Group controlId="formNameEn" className="mt-3">
              <Form.Label>{getText("Назва (EN)", "Name (EN)")}</Form.Label>
              <Form.Control
                type="text"
                value={editData.name_en}
                onChange={(e) => setEditData((prev) => ({ ...prev, name_en: e.target.value }))}
              />
            </Form.Group>
            <Form.Group controlId="formCategory" className="mt-3">
              <Form.Label>{getText("Категорія", "Category")}</Form.Label>
              <Form.Select
                value={editData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">{getText("Оберіть категорію", "Select Category")}</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {language === "uk" ? (
                      category === "accessories" ? "Аксесуари" :
                      category === "footwear" ? "Взуття" :
                      category === "clothing" ? "Одяг" :
                      category === "bags" ? "Сумки" : category
                    ) : category}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            {getText("Закрити", "Close")}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {getText("Зберегти", "Save")}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} className={darkMode ? "dark-mode" : ""}>
        <Modal.Header closeButton>
          <Modal.Title>{getText("Підтвердження видалення", "Confirm Deletion")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {getText(
            `Ви впевнені, що хочете видалити категорію "${category.name.uk}"?`,
            `Are you sure you want to delete the category "${category.name.en}"?`
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="category-card-cancel">
            {getText("Скасувати", "Cancel")}
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="category-card-delete">
            {getText("Видалити", "Delete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CategoryCard;