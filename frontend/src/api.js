import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email) => api.post('/auth/login', { email }),
  verify: (token) => api.post('/auth/verify', { token })
};

export const portraitAPI = {
  generate: (formData) => api.post('/portrait/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getGeneration: (id) => api.get(`/portrait/${id}`),
  listGenerations: () => api.get('/portrait')
};

export const printifyAPI = {
  getProducts: () => api.get('/printify/products'),
  getProductDetails: (type) => api.get(`/printify/product/${type}`),
  createProduct: (data) => api.post('/printify/create-product', data)
};

export const paymentAPI = {
  createCheckout: (data) => api.post('/payment/checkout', data),
  captureOrder: (orderId) => api.post(`/payment/capture/${orderId}`),
  getOrder: (orderId) => api.get(`/payment/orders/${orderId}`),
  getOrders: () => api.get('/payment/orders')
};

export default api;
