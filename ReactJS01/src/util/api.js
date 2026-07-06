import axios from "./axios.customize";

const registerApi = (name, email, password, otp) => {
  const URL_API = "/v1/api/register";
  const data = {
    name,
    email,
    password,
    otp,
  };

  return axios.post(URL_API, data);
};

const sendRegisterOtpApi = (email) => {
  const URL_API = "/v1/api/register/send-otp";
  return axios.post(URL_API, { email });
};

const sendForgotPasswordOtpApi = (email) => {
  const URL_API = "/v1/api/forgot-password/send-otp";
  return axios.post(URL_API, { email });
};

const resetPasswordApi = (email, otp, newPassword) => {
  const URL_API = "/v1/api/forgot-password";
  return axios.post(URL_API, { email, otp, newPassword });
};

const loginApi = (email, password) => {
  const URL_API = "/v1/api/login";
  const data = {
    email,
    password,
  };

  return axios.post(URL_API, data);
};

const getUserApi = () => {
  const URL_API = "/v1/api/user";
  return axios.get(URL_API);
};

const getCurrentUserApi = () => {
  const URL_API = "/v1/api/user/me";
  return axios.get(URL_API);
};

const getCategoriesApi = () => {
  return axios.get("/v1/api/categories");
};

const getProductsApi = () => {
  const URL_API = "/v1/api/products";
  return axios.get(URL_API);
};

const getActivePromotionsApi = () => {
  return axios.get("/v1/api/promotions/active");
};

const getCartApi = () => {
  return axios.get("/v1/api/cart");
};

const addToCartApi = (productId, quantity) => {
  return axios.post("/v1/api/cart", { productId, quantity });
};

const updateCartItemApi = (productId, quantity) => {
  return axios.put("/v1/api/cart", { productId, quantity });
};

const deleteCartItemApi = (productId) => {
  return axios.delete(`/v1/api/cart/${productId}`);
};

const clearCartApi = () => {
  return axios.delete("/v1/api/cart");
};

const createOrderApi = (orderData) => {
  return axios.post("/v1/api/orders", orderData);
};

const getMyOrdersApi = () => {
  return axios.get("/v1/api/orders");
};

const getOrderDetailsApi = (orderId) => {
  return axios.get(`/v1/api/orders/${orderId}`);
};

const cancelOrderApi = (orderId, reason) => {
  return axios.post(`/v1/api/orders/${orderId}/cancel`, { reason });
};

const markOrderAsReceivedApi = (orderId) => {
  return axios.post(`/v1/api/orders/${orderId}/received`);
};

const verifyMomoPaymentApi = (orderId) => {
  return axios.post(`/v1/api/orders/${orderId}/verify-momo`);
};

const getShopOrdersApi = () => {
  return axios.get("/v1/api/admin/orders");
};

const updateShopOrderStatusApi = (orderId, status) => {
  return axios.patch(`/v1/api/admin/orders/${orderId}`, { status });
};

const handleShopCancelRequestApi = (orderId, action) => {
  return axios.post(`/v1/api/admin/orders/${orderId}/cancel-request`, {
    action,
  });
};

const updateProfileApi = (formData) => {
  return axios.put("/v1/api/user/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const createCategoryApi = (data) => {
  return axios.post("/v1/api/admin/categories", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const updateCategoryApi = (id, data) => {
  return axios.put(`/v1/api/admin/categories/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const deleteCategoryApi = (id) => {
  return axios.delete(`/v1/api/admin/categories/${id}`);
};

export {
  registerApi,
  loginApi,
  getUserApi,
  getCurrentUserApi,
  getProductsApi,
  getActivePromotionsApi,
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  deleteCartItemApi,
  clearCartApi,
  createOrderApi,
  getMyOrdersApi,
  getOrderDetailsApi,
  cancelOrderApi,
  markOrderAsReceivedApi,
  verifyMomoPaymentApi,
  getShopOrdersApi,
  updateShopOrderStatusApi,
  handleShopCancelRequestApi,
  updateProfileApi,
  sendRegisterOtpApi,
  sendForgotPasswordOtpApi,
  resetPasswordApi,
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
};
