// src/config/constants.js
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://newstore-sepia.vercel.app/' 
  : 'http://localhost:5000/api';

export const PRODUCTS_API_URL = `${API_BASE_URL}/products`;
export const AUTH_API_URL = `${API_BASE_URL}/auth`;
export const ORDERS_API_URL = `${API_BASE_URL}/orders`;
export const CONTENT_API_URL = `${API_BASE_URL}/content`;