import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Container, Row, Col, Button, Spinner, Form, Offcanvas, Accordion, Badge, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import ProductCard from "./ProductCard";
import ProductEditorModal from "./ProductEditorModal";
import { useCart } from "./Cart";
import { CartProvider } from "./Cart";
import { useLocation, useNavigate } from "react-router-dom";
import CategoriesPage from "./CategoriesPage";
import "../styles/CategoriesPage.css";

const ProductPage = ({ darkMode, language, filters: initialFilters }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { addToCart } = useCart();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showBadge, setShowBadge] = useState({ show: false, message: "", variant: "success" });
  const [sortOption, setSortOption] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: initialFilters?.category || null,
    subcategory: initialFilters?.subcategory || null,
    brand: initialFilters?.brand || null,
    colors: initialFilters?.colors || null,
    sizes: initialFilters?.sizes || [],
    material: initialFilters?.material || null,
    country: initialFilters?.country || null,
    minPrice: "",
    maxPrice: "",
    isNewPrice: initialFilters?.isNewPrice || null,
    isSale: initialFilters?.isSale || null,
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subcategories: [],
    brands: [],
    colors: [],
    materials: [],
    countries: [],
    seasons: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getText = (ua, en) => (language === "uk" ? ua : en);

  const onViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let subcategory = null;
    try {
      const subcategoryParam = searchParams.get("subcategory");
      if (subcategoryParam) {
        subcategory = JSON.parse(decodeURIComponent(subcategoryParam));
      }
    } catch (error) {
      console.error("Помилка парсингу subcategory:", error);
    }
  
    const newFilters = {
      category: searchParams.get("category") || null,
      subcategory,
      brand: searchParams.get("brand") || null,
      colors: searchParams.get("colors") ? JSON.parse(decodeURIComponent(searchParams.get("colors"))) : null,
      sizes: searchParams.get("sizes") ? searchParams.get("sizes").split(",") : [],
      material: searchParams.get("material") ? JSON.parse(decodeURIComponent(searchParams.get("material"))) : null,
      country: searchParams.get("country") ? JSON.parse(decodeURIComponent(searchParams.get("country"))) : null,
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      isNewPrice: searchParams.get("isNewPrice") === "true" ? true : null,
      isSale: searchParams.get("isSale") === "true" ? true : null,
    };
  
    if (newFilters.isSale || newFilters.isNewPrice) {
      newFilters.category = null;
      newFilters.subcategory = null;
    }
  
    setFilters(newFilters);
    setSearchQuery(searchParams.get("query") || "");
    setSortOption(searchParams.get("sort") || "popularity");
    setIsInitialLoad(false);
  }, [location.search]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get("/api/products/filters", {
        params: { category: filters.category },
      });
      setFilterOptions({
        categories: response.data.categories || [],
        subcategories: response.data.subcategories || [],
        brands: response.data.brands || [],
        colors: response.data.colors || [],
        materials: response.data.materials || [],
        countries: response.data.countries || [],
        seasons: response.data.seasons || [],
      });
    } catch (error) {
      console.error("Помилка завантаження опцій фільтрів:", error);
    }
  }, [filters.category]);

  const fetchProducts = useCallback(
    async (page = 1, reset = false) => {
      try {
        setLoading(true);
        const params = {
          page,
          sort: sortOption,
          language,
          ...(filters.isNewPrice !== null && { isNewPrice: filters.isNewPrice }),
          ...(filters.isSale !== null && { isSale: filters.isSale }),
        };
  
        if (location.state?.searchResults && page === 1 && reset) {
          console.log("Using search results from location.state:", location.state.searchResults);
          setProducts(location.state.searchResults);
          setTotalPages(1);
          setCurrentPage(1);
          setLoading(false);
          return;
        }
  
        if (searchQuery) {
          console.log("Performing search with query:", searchQuery);
          const response = await axios.get("/api/products/search", {
            params: { query: searchQuery },
          });
          console.log("Search response:", response.data);
          setProducts(response.data);
          setTotalPages(1);
          setCurrentPage(1);
        } else {
          const response = await axios.get("/api/products", {
            params: {
              ...params,
              ...(filters.category && { category: filters.category }),
              ...(filters.subcategory &&
                (filters.subcategory.uk || filters.subcategory.en) && {
                  subcategory: JSON.stringify(filters.subcategory),
                }),
              ...(filters.brand && { brand: filters.brand }),
              ...(filters.material &&
                (filters.material.uk || filters.material.en) && {
                  material: JSON.stringify(filters.material),
                }),
              ...(filters.country &&
                (filters.country.uk || filters.country.en) && {
                  country: JSON.stringify(filters.country),
                }),
              ...(filters.colors &&
                (filters.colors.uk || filters.colors.en) && {
                  colors: JSON.stringify(filters.colors),
                }),
              ...(filters.sizes &&
                filters.sizes.length > 0 && { sizes: filters.sizes.join(",") }),
              ...(filters.minPrice && { minPrice: filters.minPrice }),
              ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
            },
            headers: { "Cache-Control": "no-cache" },
          });
  
          if (reset) {
            setProducts(response.data.products || []);
          } else {
            setProducts((prevProducts) => {
              const existingIds = prevProducts.map((p) => p._id);
              const uniqueNew = response.data.products.filter(
                (p) => !existingIds.includes(p._id)
              );
              return [...prevProducts, ...uniqueNew];
            });
          }
  
          setTotalPages(response.data.totalPages || 1);
          setCurrentPage(response.data.currentPage || 1);
        }
      } catch (error) {
        console.error("Error fetching products:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, sortOption, searchQuery, location.state, language]
  );

  const loadMoreProducts = async () => {
    if (currentPage >= totalPages || searchQuery) return;
    try {
      setIsLoadingMore(true);
      await fetchProducts(currentPage + 1);
    } catch (error) {
      console.error("Помилка завантаження додаткових товарів:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === "category") {
        newFilters.subcategory = null;
        newFilters.brand = null;
        newFilters.colors = null;
        newFilters.material = null;
        newFilters.country = null;
        newFilters.sizes = [];
        if (!new URLSearchParams(location.search).has("isNewPrice")) {
          newFilters.isNewPrice = null;
        }
        if (!new URLSearchParams(location.search).has("isSale")) {
          newFilters.isSale = null;
        }
      }
      return newFilters;
    });
    setSearchQuery("");
  };

  const updateUrl = useCallback((newFilters, query = "") => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.subcategory && (newFilters.subcategory.uk || newFilters.subcategory.en)) {
      params.set("subcategory", encodeURIComponent(JSON.stringify(newFilters.subcategory)));
    }
    if (newFilters.brand) params.set("brand", newFilters.brand);
    if (newFilters.colors && (newFilters.colors.uk || newFilters.colors.en)) {
      params.set("colors", encodeURIComponent(JSON.stringify(newFilters.colors)));
    }
    if (newFilters.sizes && newFilters.sizes.length > 0) {
      params.set("sizes", newFilters.sizes.join(","));
    }
    if (newFilters.material && (newFilters.material.uk || newFilters.material.en)) {
      params.set("material", encodeURIComponent(JSON.stringify(newFilters.material)));
    }
    if (newFilters.country && (newFilters.country.uk || newFilters.country.en)) {
      params.set("country", encodeURIComponent(JSON.stringify(newFilters.country)));
    }
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice);
    if (newFilters.isNewPrice !== null) params.set("isNewPrice", newFilters.isNewPrice);
    if (newFilters.isSale !== null) params.set("isSale", newFilters.isSale);
    if (query) params.set("query", query);
    if (sortOption) params.set("sort", sortOption);
    navigate(`/products?${params.toString()}`, { replace: true });
  }, [navigate, sortOption]);

  useEffect(() => {
    if (!isInitialLoad) {
      updateUrl(filters, searchQuery);
    }
  }, [filters, searchQuery, updateUrl, isInitialLoad]);

  const resetFilters = () => {
    const newFilters = {
      category: null,
      subcategory: null,
      brand: null,
      colors: null,
      sizes: [],
      material: null,
      country: null,
      minPrice: "",
      maxPrice: "",
      isNewPrice: new URLSearchParams(location.search).has("isNewPrice") ? filters.isNewPrice : null,
      isSale: new URLSearchParams(location.search).has("isSale") ? filters.isSale : null,
    };
    setFilters(newFilters);
    setSearchQuery("");
  };

  useEffect(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "" && !(Array.isArray(value) && value.length === 0)) {
        if (key === "subcategory" && (!value?.uk && !value?.en)) return;
        if (key === "material" && (!value?.uk && !value?.en)) return;
        if (key === "country" && (!value?.uk && !value?.en)) return;
        if (key === "colors" && (!value?.uk && !value?.en)) return;
        if (key === "isNewPrice" && value === null) return;
        count++;
      }
    });
    setActiveFiltersCount(count);
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    if (!isInitialLoad) {
      fetchProducts(1, true);
    }
  }, [filters, searchQuery, sortOption, fetchProducts, isInitialLoad]);

  const openEditor = (product = null) => {
    setCurrentProduct(product);
    setShowEditorModal(true);
  };

  const handleDelete = async (productId) => {
    try {
      const response = await axios.delete(`/api/products/${productId}`);
      if (response.status === 200) {
        await fetchProducts(currentPage, true);
        setShowBadge({ show: true, message: getText("Товар успішно видалено", "Product deleted successfully"), variant: "success" });
        setTimeout(() => setShowBadge({ show: false, message: "", variant: "" }), 3000);
      }
    } catch (error) {
      console.error("Помилка видалення товару:", error);
      const errorMessage = error.response?.data?.message || error.message;
      setShowBadge({ show: true, message: getText(`Помилка видалення: ${errorMessage}`, `Delete error: ${errorMessage}`), variant: "danger" });
      setTimeout(() => setShowBadge({ show: false, message: "", variant: "" }), 3000);
    }
  };

  const handleSave = async () => {
    try {
      await fetchProducts(currentPage, true);
    } catch (error) {
      console.error("Помилка збереження:", error);
    }
  };

  const getCategoryName = (category) => {
    return getText(
      category === "accessories" ? "Аксесуари" :
      category === "footwear" ? "Взуття" :
      category === "clothing" ? "Одяг" :
      category === "bags" ? "Сумки" : category,
      category
    );
  };

  const renderFilters = () => (
    <Offcanvas
      show={showFilters}
      onHide={() => setShowFilters(false)}
      placement="start"
      className={`filters-offcanvas ${darkMode ? "dark-mode" : ""}`}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {getText("Фільтри", "Filters")}
          {activeFiltersCount > 0 && (
            <Badge bg="primary" className="ms-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Accordion defaultActiveKey={["0"]} alwaysOpen>
          <Accordion.Item eventKey="0" className="filter-group">
            <Accordion.Header>{getText("Категорія", "Category")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.category || ""}
                onChange={(e) => handleFilterChange("category", e.target.value || null)}
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі категорії", "All categories")}</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryName(category)}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          {filters.category && (
            <Accordion.Item eventKey="1" className="filter-group">
              <Accordion.Header>{getText("Підкатегорія", "Subcategory")}</Accordion.Header>
              <Accordion.Body>
                <Form.Select
                  value={filters.subcategory ? JSON.stringify(filters.subcategory) : ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "subcategory",
                      e.target.value ? JSON.parse(e.target.value) : null
                    )
                  }
                  className={darkMode ? "bg-dark text-white border-secondary" : ""}
                >
                  <option value="">{getText("Всі підкатегорії", "All subcategories")}</option>
                  {filterOptions.subcategories.map((subcat) => (
                    <option key={subcat.en} value={JSON.stringify(subcat)}>
                      {language === "uk" ? subcat.uk : subcat.en}
                    </option>
                  ))}
                </Form.Select>
              </Accordion.Body>
            </Accordion.Item>
          )}

          <Accordion.Item eventKey="2" className="filter-group">
            <Accordion.Header>{getText("Бренд", "Brand")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.brand || ""}
                onChange={(e) => handleFilterChange("brand", e.target.value || null)}
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі бренди", "All brands")}</option>
                {filterOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="3" className="filter-group">
            <Accordion.Header>{getText("Колір", "Color")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.colors ? JSON.stringify(filters.colors) : ""}
                onChange={(e) =>
                  handleFilterChange(
                    "colors",
                    e.target.value ? JSON.parse(e.target.value) : null
                  )
                }
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі кольори", "All colors")}</option>
                {filterOptions.colors.map((color) => (
                  <option key={color.en} value={JSON.stringify(color)}>
                    {language === "uk" ? color.uk : color.en}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="4" className="filter-group">
            <Accordion.Header>{getText("Матеріал", "Material")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.material ? JSON.stringify(filters.material) : ""}
                onChange={(e) =>
                  handleFilterChange(
                    "material",
                    e.target.value ? JSON.parse(e.target.value) : null
                  )
                }
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі матеріали", "All materials")}</option>
                {filterOptions.materials.map((material) => (
                  <option key={material.en} value={JSON.stringify(material)}>
                    {language === "uk" ? material.uk : material.en}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="5" className="filter-group">
            <Accordion.Header>{getText("Країна", "Country")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.country ? JSON.stringify(filters.country) : ""}
                onChange={(e) =>
                  handleFilterChange(
                    "country",
                    e.target.value ? JSON.parse(e.target.value) : null
                  )
                }
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі країни", "All countries")}</option>
                {filterOptions.countries.map((country) => (
                  <option key={country.en} value={JSON.stringify(country)}>
                    {language === "uk" ? country.uk : country.en}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="6" className="filter-group">
            <Accordion.Header>{getText("Сезон", "Season")}</Accordion.Header>
            <Accordion.Body>
              <Form.Select
                value={filters.season || ""}
                onChange={(e) => handleFilterChange("season", e.target.value || null)}
                className={darkMode ? "bg-dark text-white border-secondary" : ""}
              >
                <option value="">{getText("Всі сезони", "All seasons")}</option>
                {filterOptions.seasons.map((season) => (
                  <option key={season} value={season}>
                    {language === "uk"
                      ? season === "winter" ? "Зима" :
                        season === "summer" ? "Літо" :
                        season === "demiseason" ? "Демісезон" :
                        season === "allseason" ? "Всесезон" : season
                      : season}
                  </option>
                ))}
              </Form.Select>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="7" className="filter-group">
            <Accordion.Header>{getText("Ціна", "Price")}</Accordion.Header>
            <Accordion.Body>
              <div className="price-filters">
                <Form.Control
                  type="number"
                  placeholder={getText("Від", "From")}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className={darkMode ? "bg-dark text-white border-secondary" : ""}
                />
                <span className="mx-2">-</span>
                <Form.Control
                  type="number"
                  placeholder={getText("До", "To")}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className={darkMode ? "bg-dark text-white border-secondary" : ""}
                />
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="filter-actions mt-3">
          <Button variant="danger" onClick={resetFilters} className="me-2">
            {getText("Скинути", "Reset")}
          </Button>
          <Button variant="primary" onClick={() => setShowFilters(false)}>
            {getText("Застосувати", "Apply")}
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="pagination-container">
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {getText("Попередня", "Previous")}
          </button>
          {pages.map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === currentPage ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {getText("Наступна", "Next")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <CartProvider darkMode={darkMode} language={language}>
      <Container
        fluid
        className={`py-4 main-container ${darkMode ? "bg-dark text-light" : "bg-light text-dark"}`}
      >
        <h2 className="text-center mb-4">
          {searchQuery
            ? getText(`Результати пошуку для "${searchQuery}"`, `Search results for "${searchQuery}"`)
            : filters.isSale
            ? getText("Розпродаж", "Sale")
            : filters.isNewPrice
            ? getText("Нові надходження", "New Arrivals")
            : filters.category
            ? getCategoryName(filters.category)
            : getText("Каталог", "Catalog")}
        </h2>

        {/* Верхній рядок: Додати товар */}
        {isAdmin && (
          <div className="d-flex justify-content-end mb-3">
            <Button
              onClick={() => openEditor()}
              variant={darkMode ? "light" : "primary"}
              className="add-product-btn"
            >
              {getText("Додати товар", "Add Product")}
            </Button>
          </div>
        )}

        {/* Badge-повідомлення */}
        {showBadge.show && (
          <Alert
            variant={showBadge.variant}
            onClose={() => setShowBadge({ show: false, message: "", variant: "" })}
            dismissible
            className="text-center"
            style={{ position: "fixed", top: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}
          >
            {showBadge.message}
          </Alert>
        )}

        {/* Нижній блок: Фільтр — Сортування — Назад */}
        <div className="d-flex justify-content-between align-items-center mb-4 filter-sort-controls">
          <div className="left">
            <Button
              variant={darkMode ? "outline-light" : "outline-primary"}
              onClick={() => setShowFilters(true)}
              className="filters-button"
            >
              {getText("Фільтри", "Filters")}
              {activeFiltersCount > 0 && (
                <Badge bg="primary" className="ms-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="center">
            <Form.Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={`sort-select sort-select-option ${darkMode ? "bg-dark text-white border-secondary" : ""}`}
            >
              <option value="popularity">{getText("За популярністю", "By Popularity")}</option>
              <option value="price-asc">{getText("За ціною: від нижчої до вищої", "By Price: Low to High")}</option>
              <option value="price-desc">{getText("За ціною: від вищої до нижчої", "By Price: High to Low")}</option>
              <option value="name-asc">{getText("За назвою: від А до Я", "By Name: A to Z")}</option>
              <option value="name-desc">{getText("За назвою: від Я до А", "By Name: Z to A")}</option>
            </Form.Select>
          </div>

          <div className="right">
            <Button
              variant={darkMode ? "outline-light" : "outline-primary"}
              onClick={() => navigate("/products")}
              className="btn-back-categories"
            >
              {getText("Назад до категорій", "Back to Categories")}
            </Button>
          </div>
        </div>

        {renderFilters()}

        {loading && products.length === 0 ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "200px" }}
          >
            <Spinner animation="border" role="status" />
          </div>
        ) : (
          <>
            {(filters.category || filters.isSale || filters.isNewPrice || searchQuery) ? (
              <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 px-4 products">
                {products.length === 0 ? (
                  <Col>
                    <p className="text-center">{getText("Немає товарів", "No products found")}</p>
                  </Col>
                ) : (
                  products.map((product) => (
                    <Col key={product._id}>
                      <ProductCard
                        product={product}
                        darkMode={darkMode}
                        language={language}
                        isAdmin={isAdmin}
                        onEdit={() => openEditor(product)}
                        onDelete={() => handleDelete(product._id)}
                        onAddToCart={() => addToCart(product)}
                        onViewDetails={() => onViewDetails(product._id)}
                      />
                    </Col>
                  ))
                )}
              </Row>
            ) : (
              <CategoriesPage darkMode={darkMode} language={language} />
            )}

            {currentPage < totalPages && !searchQuery && (
              <div className="text-center mt-4">
                <Button
                  variant={darkMode ? "outline-light" : "outline-primary"}
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="btn-load-more"
                >
                  {isLoadingMore
                    ? getText("Завантаження...", "Loading...")
                    : getText("Завантажити ще", "Load More")}
                </Button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  fetchProducts(page, true);
                }}
              />
            )}
          </>
        )}

        {showEditorModal && (
          <ProductEditorModal
            show={showEditorModal}
            onHide={() => setShowEditorModal(false)}
            product={currentProduct}
            onSave={handleSave}
            darkMode={darkMode}
            language={language}
          />
        )}
      </Container>
    </CartProvider>
  );
};

export default ProductPage;