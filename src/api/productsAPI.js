import axios from 'axios';
import { PRODUCTS_API_URL } from '../config/constants';

const API_URL = PRODUCTS_API_URL;

// Допоміжна функція для побудови параметрів фільтрації
const buildFilters = (filters) => {
  const params = {
    page: filters.page,
    category: filters.category || undefined,
    subcategory: filters.subcategory || undefined,
    brand: filters.brand || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    material: filters.material || undefined,
    country: filters.country || undefined,
    colors: filters.color || undefined,
    isNewPrice: filters.isNewPrice || undefined,
    isSale: filters.isSale || undefined, // Додаємо isSale до параметрів
  };

  // Обробка кольорів: перетворення масиву або рядка в потрібний формат
  if (filters.colors && Array.isArray(filters.colors) && filters.colors.length > 0) {
    params.colors = filters.colors.join(',');
  } else if (typeof filters.colors === 'string' && filters.colors.trim() !== '') {
    params.colors = filters.colors.trim();
  }

  // Видаляємо порожні значення
  Object.keys(params).forEach(key => {
    if (params[key] === undefined || params[key] === '') {
      delete params[key];
    }
  });

  return params;
};

// Отримання товарів з фільтрами та сортуванням
export const fetchProducts = async (page = 1, filters = {}, sort = '') => {
  const filterParams = buildFilters(filters);
  const params = {
    page,
    ...filterParams,
    sort,
  };

  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Отримання варіантів фільтрації
export const fetchFilterOptions = async () => {
  try {
    const response = await axios.get(`${API_URL}/filters`);
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

// Створення нового товару
export const createProduct = async (productData) => {
  try {
    const formData = new FormData();

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // Якщо масив — перетворюємо в JSON або додаємо елементи окремо
          const isObjectArray = value.every(item => typeof item === 'object');
          if (isObjectArray) {
            formData.append(key, JSON.stringify(value));
          } else {
            value.forEach(item => formData.append(key, item));
          }
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    const response = await axios.post(API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    throw error;
  }
};

// Оновлення товару
export const updateProduct = async (id, updatedData) => {
  try {
    const formData = new FormData();

    Object.entries(updatedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          const isObjectArray = value.every(item => typeof item === 'object');
          if (isObjectArray) {
            formData.append(key, JSON.stringify(value));
          } else {
            value.forEach(item => formData.append(key, item));
          }
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    const response = await axios.put(`${API_URL}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  } catch (error) {
    console.error('Error updating product:', error.response?.data || error.message);
    throw error;
  }
};

// Видалення товару
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Отримання брендів (не обов’язкове, якщо не використовується)
export const fetchBrands = async () => {
  try {
    const response = await axios.get(`${API_URL}/brands`);
    return response.data;
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};