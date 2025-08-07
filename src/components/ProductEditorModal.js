import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Modal, Button, Form, Image, Row, Col, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from "axios";
import '../styles/ProductEditorModal.css';

function ProductEditorModal({ show, onHide, product, darkMode, language, onSave }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const initialFormData = useMemo(() => ({
    name: { uk: "", en: "" },
    description: { uk: "", en: "" },
    detailedDescription: { uk: "", en: "" },
    subcategory: { uk: "", en: "" },
    oldPrice: "",
    newPrice: "",
    brand: "",
    category: "",
    season: "",
    gender: "",
    sizes: "",
    colors: { uk: "", en: "" }, // Двомовна структура
    countryOfOrigin: { uk: "", en: "" },
    features: { material: { uk: "", en: "" }, warranty: "", waterproof: false, isNewPrice: false, isSale: false }
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setPreviewUrls([]);
    setSelectedFiles([]);
    setError("");
  }, [initialFormData]);

  useEffect(() => {
    if (product) {
      setFormData({
        ...initialFormData,
        ...product,
        name: product.name || { uk: "", en: "" },
        description: product.description || { uk: "", en: "" },
        detailedDescription: product.detailedDescription || { uk: "", en: "" },
        subcategory: product.subcategory || { uk: "", en: "" },
        countryOfOrigin: product.countryOfOrigin || { uk: "", en: "" },
        features: {
          material: product.features?.material || { uk: "", en: "" },
          warranty: product.features?.warranty || "",
          waterproof: product.features?.waterproof || false,
          isNewPrice: product.features?.isNewPrice || false
        },
        sizes: product.sizes || "", // Ensure sizes is treated as a string
        colors: product.colors || { uk: "", en: "" } // Ensure colors is treated as an object
      });
      setPreviewUrls(Array.isArray(product.images) ? product.images.map(img => `${img}`) : []);
    } else {
      resetForm();
    }
  }, [product, initialFormData, resetForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("name.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        name: { ...prev.name, [lang]: value }
      }));
    } else if (name.startsWith("description.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        description: { ...prev.description, [lang]: value }
      }));
    } else if (name.startsWith("detailedDescription.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        detailedDescription: { ...prev.detailedDescription, [lang]: value }
      }));
    } else if (name.startsWith("subcategory.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        subcategory: { ...prev.subcategory, [lang]: value }
      }));
    } else if (name.startsWith("features.material.")) {
      const lang = name.split(".")[2];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          material: { ...prev.features.material, [lang]: value }
        }
      }));
    } else if (name === "features.warranty") {
      setFormData(prev => ({
        ...prev,
        features: { ...prev.features, warranty: value }
      }));
    } else if (name === "features.waterproof") {
      setFormData(prev => ({
        ...prev,
        features: { ...prev.features, waterproof: e.target.checked }
      }));
    } else if (name === "features.isNewPrice") {
      setFormData(prev => ({
        ...prev,
        features: { ...prev.features, isNewPrice: e.target.checked }
      }));
    } else if (name.startsWith("countryOfOrigin.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        countryOfOrigin: { ...prev.countryOfOrigin, [lang]: value }
      }));
    } else if (name.startsWith("colors.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        colors: { ...prev.colors, [lang]: value }
      }));
    } else if (name === "oldPrice") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        features: {
          ...prev.features,
          // Автоматично встановлюємо isSale при введенні oldPrice
          isSale: value && value > 0
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5 - previewUrls.length;

    if (files.length > maxFiles) {
      setError(getText(`Максимум ${maxFiles} фото можна додати`, `Maximum ${maxFiles} photos can be added`));
      return;
    }

    const validFiles = files.filter(file => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);

    if (validFiles.length !== files.length) {
      setError(getText(`Деякі файли не є зображеннями або занадто великі`, `Some files are not images or are too large`));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.name?.uk || !formData.name?.en) {
      setError(getText("Будь ласка, введіть назву українською та англійською", "Please enter name in Ukrainian and English"));
      return false;
    }
    if (!formData.newPrice || isNaN(formData.newPrice)) {
      setError(getText("Будь ласка, введіть коректну ціну", "Please enter a valid price"));
      return false;
    }
    if (!formData.category) {
      setError(getText("Будь ласка, оберіть категорію", "Please select a category"));
      return false;
    }
    if (!formData.brand) {
      setError(getText("Будь ласка, введіть бренд", "Please enter a brand"));
      return false;
    }
    if (formData.features?.isSale && (!formData.oldPrice || formData.oldPrice <= formData.newPrice)) {
      setError(getText("Для товару зі знижкою стара ціна має бути вищою за нову", "For sale items old price must be higher than new price"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    const formDataToSend = new FormData();
  
    console.log("FormData before sending:", formData);
  
    // Обробка subcategory
    if (formData.subcategory && (formData.subcategory.uk || formData.subcategory.en)) {
      const subcategoryData = {
        uk: formData.subcategory.uk?.trim() || formData.subcategory.en?.trim() || "",
        en: formData.subcategory.en?.trim() || formData.subcategory.uk?.trim() || ""
      };
      formDataToSend.append("subcategory", JSON.stringify(subcategoryData));
    }
  
    // Додаємо лише потрібні поля, виключаючи reviews
    const allowedFields = [
      "name", "description", "detailedDescription", "oldPrice", "newPrice",
      "brand", "category", "season", "gender", "sizes", "colors",
      "countryOfOrigin", "features", "accessoriesType", "footwearType",
      "clothingType", "hatsType"
    ];
  
    Object.entries(formData).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== null && value !== undefined) {
        if (typeof value === "object" && !Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value);
        }
      }
    });
  
    selectedFiles.forEach((file) => {
      formDataToSend.append("images", file);
    });
  
    // Логування FormData
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`FormData entry: ${key} =`, value);
    }
  
    try {
      const endpoint = product ? `/api/products/${product._id}` : "/api/products";
      const method = product ? "put" : "post";
  
      const response = await axios[method](endpoint, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      console.log("Server response:", response.data);
      onSave();
      onHide();
    } catch (err) {
      console.error("Error saving product:", err.response?.data || err.message);
      setError(
        getText(
          "Помилка збереження товару: " + (err.response?.data?.message || err.message),
          "Error saving product: " + (err.response?.data?.message || err.message)
        )
      );
    }
  };

  const getText = (uk, en) => (language === "uk" ? uk : en);

  const seasonOptions = ["winter", "summer", "demiseason", "allseason"];
  const genderOptions = ["male", "female", "unisex", "kids"];

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className={darkMode ? "dark-mode-modal" : ""}>
      <Modal.Header closeButton className="bg-dark text-light">
        <Modal.Title>
          <h4>{product ? getText("Редагувати товар", "Edit Product") : getText("Додати товар", "Add Product")}</h4>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={darkMode ? "bg-dark text-light" : ""}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Form.Group className="mb-4">
            <Form.Label>{getText("Зображення товару", "Product Images")} ({previewUrls.length}/5)</Form.Label>
            <Row>
              {previewUrls.map((url, index) => (
                <Col key={index} xs={4} className="mb-3 position-relative">
                  <Image src={url} thumbnail className="product-image" onError={(e) => { e.target.onerror = null; e.target.src = "path/to/placeholder-image.jpg"; }} />
                  <Button variant="danger" size="sm" className="position-absolute top-0 end-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px" }} onClick={() => removeImage(index)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </Col>
              ))}
              {previewUrls.length < 5 && (
                <Col xs={4} className="mb-3">
                  <div className="image-upload-placeholder" onClick={() => fileInputRef.current.click()}>
                    <span>+</span>
                    <small>{getText("Додати", "Add")}</small>
                  </div>
                </Col>
              )}
            </Row>
            <Form.Control type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" style={{ display: "none" }} />
          </Form.Group>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Назва (Українська)", "Name (Ukrainian)")} *</Form.Label>
              <Form.Control name="name.uk" value={formData.name?.uk || ''} onChange={handleChange} required />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Назва (Англійська)", "Name (English)")} *</Form.Label>
              <Form.Control name="name.en" value={formData.name?.en || ''} onChange={handleChange} required />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Бренд", "Brand")} *</Form.Label>
              <Form.Control name="brand" value={formData.brand || ''} onChange={handleChange} required placeholder={getText("Введіть бренд", "Enter brand")} />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Категорія", "Category")} *</Form.Label>
              <Form.Select name="category" value={formData.category || ''} onChange={handleChange} required>
                <option value="">{getText("Оберіть категорію", "Select Category")}</option>
                <option value="accessories">{getText("Аксесуари", "Accessories")}</option>
                <option value="footwear">{getText("Взуття", "Footwear")}</option>
                <option value="clothing">{getText("Одяг", "Clothing")}</option>
                <option value="bags">{getText("Сумки", "Bags")}</option>
              </Form.Select>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Підкатегорія (Українська)", "Subcategory (Ukrainian)")}</Form.Label>
              <Form.Control name="subcategory.uk" value={formData.subcategory?.uk || ''} onChange={handleChange} />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Підкатегорія (Англійська)", "Subcategory (English)")}</Form.Label>
              <Form.Control name="subcategory.en" value={formData.subcategory?.en || ''} onChange={handleChange} />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Нова ціна", "New Price")} *</Form.Label>
              <Form.Control type="number" name="newPrice" value={formData.newPrice || ''} onChange={handleChange} required />
            </Form.Group>
            <Form.Group as={Col} md={3}>
              <Form.Label>{getText("Знижка", "Sale")}</Form.Label>
              <Form.Check
                type="checkbox"
                name="features.isSale"
                checked={formData.features?.isSale || false}
                onChange={(e) => {
                  // Оновлюємо стан форми
                  setFormData(prev => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      isSale: e.target.checked,
                      // Якщо знімаємо знижку - очищаємо стару ціну
                      ...(e.target.checked === false ? {} : {})
                    },
                    // Очищаємо oldPrice при знятті галочки
                    ...(e.target.checked === false ? { oldPrice: "" } : {})
                  }));
                }}
                label={getText("Знижка", "Sale")}
              />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Стара ціна", "Old Price")}</Form.Label>
              <Form.Control 
                type="number" 
                name="oldPrice" 
                value={formData.oldPrice || ''} 
                onChange={handleChange}
                disabled={!formData.features?.isSale} // Дизейблимо, якщо не обрано isSale
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Сезон", "Season")}</Form.Label>
              <Form.Select name="season" value={formData.season || ''} onChange={handleChange}>
                <option value="">{getText("Оберіть сезон", "Select Season")}</option>
                {seasonOptions.map(season => (
                  <option key={season} value={season}>
                    {getText(
                      season === 'winter' ? 'Зима' :
                      season === 'summer' ? 'Літо' :
                      season === 'demiseason' ? 'Демісезон' :
                      season === 'allseason' ? 'Всесезнонний' :
                      season.charAt(0).toUpperCase() + season.slice(1)
                    )}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Гендер", "Gender")}</Form.Label>
              <Form.Select name="gender" value={formData.gender || ''} onChange={handleChange}>
                <option value="">{getText("Оберіть гендер", "Select Gender")}</option>
                {genderOptions.map(gender => (
                  <option key={gender} value={gender}>
                    {getText(
                      gender === 'male' ? 'Чоловічий' :
                      gender === 'female' ? 'Жіночий' :
                      gender === 'kids' ? 'Дитячий' : 'Унісекс',
                      gender.charAt(0).toUpperCase() + gender.slice(1)
                    )}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Колір (Українська)", "Color (Ukrainian)")}</Form.Label>
              <Form.Control
                type="text"
                name="colors.uk"
                value={formData.colors?.uk || ''} // Ensure colors.uk is treated as a string
                onChange={handleChange}
                placeholder={getText("Червоний, Синій", "Red, Blue")}
              />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Колір (Англійська)", "Color (English)")}</Form.Label>
              <Form.Control
                type="text"
                name="colors.en"
                value={formData.colors?.en || ''} // Ensure colors.en is treated as a string
                onChange={handleChange}
                placeholder={getText("Red, Blue", "Red, Blue")}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Розміри", "Sizes")}</Form.Label>
              <Form.Control
                type="text"
                name="sizes"
                value={formData.sizes || ''} // Ensure sizes is treated as a string
                onChange={handleChange}
                placeholder={getText("XS, S, M, L", "XS, S, M, L")}
              />
            </Form.Group>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>{getText("Короткий опис (Українська)", "Short Description (Ukrainian)")}</Form.Label>
            <Form.Control as="textarea" rows={2} name="description.uk" value={formData.description?.uk || ''} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{getText("Короткий опис (Англійська)", "Short Description (English)")}</Form.Label>
            <Form.Control as="textarea" rows={2} name="description.en" value={formData.description?.en || ''} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{getText("Детальний опис (Українська)", "Detailed Description (Ukrainian)")}</Form.Label>
            <Form.Control as="textarea" rows={4} name="detailedDescription.uk" value={formData.detailedDescription?.uk || ''} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{getText("Детальний опис (Англійська)", "Detailed Description (English)")}</Form.Label>
            <Form.Control as="textarea" rows={4} name="detailedDescription.en" value={formData.detailedDescription?.en || ''} onChange={handleChange} />
          </Form.Group>

          <h5 className="mt-4">{getText("Характеристики", "Features")}</h5>
          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Матеріал (Українська)", "Material (Ukrainian)")}</Form.Label>
              <Form.Control
                type="text"
                name="features.material.uk"
                value={formData.features?.material?.uk || ''}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Матеріал (Англійська)", "Material (English)")}</Form.Label>
              <Form.Control
                type="text"
                name="features.material.en"
                value={formData.features?.material?.en || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Країна походження (Українська)", "Country of Origin (Ukrainian)")}</Form.Label>
              <Form.Control
                type="text"
                name="countryOfOrigin.uk"
                value={formData.countryOfOrigin?.uk || ''}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Країна походження (Англійська)", "Country of Origin (English)")}</Form.Label>
              <Form.Control
                type="text"
                name="countryOfOrigin.en"
                value={formData.countryOfOrigin?.en || ''}
                onChange={handleChange}
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} md={6}>
              <Form.Label>{getText("Гарантія (місяців)", "Warranty (months)")}</Form.Label>
              <Form.Control
                type="number"
                name="features.warranty"
                value={formData.features?.warranty || ''}
                onChange={handleChange}
                placeholder={getText("Кількість місяців", "Number of months")}
              />
            </Form.Group>
            <Form.Group as={Col} md={3}>
              <Form.Label>{getText("Водостійкість", "Waterproof")}</Form.Label>
              <Form.Check
                type="checkbox"
                name="features.waterproof"
                checked={formData.features?.waterproof || false}
                onChange={handleChange}
                label={getText("Водостійкий", "Waterproof")}
              />
            </Form.Group>
            <Form.Group as={Col} md={3}>
              <Form.Label>{getText("Новинка", "New")}</Form.Label>
              <Form.Check
                type="checkbox"
                name="features.isNewPrice"
                checked={formData.features?.isNewPrice || false}
                onChange={handleChange}
                label={getText("Новинка", "New")}
              />
            </Form.Group>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer className={darkMode ? "bg-dark" : ""}>
        <Button variant="secondary" onClick={onHide}>{getText("Скасувати", "Cancel")}</Button>
        <Button variant="primary" onClick={handleSubmit}>{getText("Зберегти", "Save")}</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductEditorModal;