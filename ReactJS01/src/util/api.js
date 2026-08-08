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

const logoutApi = () => {
  return axios.post("/v1/api/logout");
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

const calculateShippingApi = (lat, lng) => {
  return axios.post("/v1/api/orders/calculate-shipping", { lat, lng });
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

const getShopOrdersApi = (page = 1, limit = 10, status = "All") => {
  let url = `/v1/api/admin/orders?page=${page}&limit=${limit}`;
  if (status && status !== "All") {
    url += `&status=${status}`;
  }
  return axios.get(url);
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
  return axios.put("/v1/api/user/profile", formData);
};

const createCategoryApi = (data) => {
  return axios.post("/v1/api/admin/categories", data);
};

const updateCategoryApi = (id, data) => {
  return axios.put(`/v1/api/admin/categories/${id}`, data);
};

const deleteCategoryApi = (id) => {
  return axios.delete(`/v1/api/admin/categories/${id}`);
};

const getAdminProductsApi = () => {
  return axios.get("/v1/api/admin/products");
};

const createProductApi = (data) => {
  return axios.post("/v1/api/admin/products", data);
};

const updateProductApi = (id, data) => {
  return axios.put(`/v1/api/admin/products/${id}`, data);
};

const deleteProductApi = (id) => {
  return axios.delete(`/v1/api/admin/products/${id}`);
};

const getProductReviewsApi = (productId, page = 1, limit = 5) => {
  return axios.get(
    `/v1/api/products/${productId}/reviews?page=${page}&limit=${limit}`,
  );
};

const submitReviewApi = (productId, data) => {
  const URL_API = `/v1/api/products/${productId}/reviews`;
  return axios.post(URL_API, data);
};

const deleteReviewApi = (productId) => {
  const URL_API = `/v1/api/products/${productId}/reviews`;
  return axios.delete(URL_API);
};

const checkReviewEligibilityApi = (productId) => {
  const URL_API = `/v1/api/products/${productId}/reviews/eligibility`;
  return axios.get(URL_API);
};

const getSettingsApi = () => {
  return axios.get("/v1/api/settings");
};

const updateSettingApi = (key, value) => {
  return axios.put("/v1/api/admin/settings", { key, value });
};

const resolveMapLinkApi = (url) => {
  return axios.post("/v1/api/utils/resolve-map-link", { url });
};

const searchNominatim = async (address) => {
  let nomRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address,
    )}`,
  );
  let nomData = await nomRes.json();

  if (nomData && nomData.length > 0) return nomData;

  // Fallback 1: Cắt bỏ phần trước dấu "-" (thường là tên riêng doanh nghiệp)
  if (address.includes("-")) {
    const shortName = address.substring(address.indexOf("-") + 1).trim();
    nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        shortName,
      )}`,
    );
    nomData = await nomRes.json();
    if (nomData && nomData.length > 0) return nomData;
  }

  // Fallback 2: Cắt bỏ phần trước dấu "," (lấy cấp địa lý rộng hơn)
  if (address.includes(",")) {
    const shorterName = address.substring(address.indexOf(",") + 1).trim();
    nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        shorterName,
      )}`,
    );
    nomData = await nomRes.json();
    if (nomData && nomData.length > 0) return nomData;
  }

  return [];
};

const getActiveVouchersApi = () => {
  return axios.get("/v1/api/vouchers/active");
};

const redeemVoucherApi = (voucherId) => {
  return axios.post("/v1/api/vouchers/redeem", { voucherId });
};

const getMyVouchersApi = () => {
  return axios.get("/v1/api/vouchers/my");
};

const createVoucherApi = (data) => {
  return axios.post("/v1/api/admin/vouchers", data);
};

const getAllAdminVouchersApi = () => {
  return axios.get("/v1/api/admin/vouchers");
};

const updateVoucherApi = (id, data) => {
  return axios.put(`/v1/api/admin/vouchers/${id}`, data);
};

const deleteVoucherApi = (id) => {
  return axios.delete(`/v1/api/admin/vouchers/${id}`);
};

const getGameQuestionApi = () => {
  return axios.get("/v1/api/game/question");
};

const submitGameAnswerApi = (token, answer) => {
  return axios.post("/v1/api/game/submit", { token, answer });
};

const getDashboardStatsApi = (year = new Date().getFullYear()) => {
  return axios.get(`/v1/api/admin/dashboard/stats?year=${year}`);
};

export {
  registerApi,
  loginApi,
  logoutApi,
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
  calculateShippingApi,
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
  getAdminProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getProductReviewsApi,
  submitReviewApi,
  deleteReviewApi,
  checkReviewEligibilityApi,
  getSettingsApi,
  updateSettingApi,
  resolveMapLinkApi,
  searchNominatim,
  getActiveVouchersApi,
  redeemVoucherApi,
  getMyVouchersApi,
  createVoucherApi,
  getAllAdminVouchersApi,
  updateVoucherApi,
  deleteVoucherApi,
  getGameQuestionApi,
  submitGameAnswerApi,
  getDashboardStatsApi,
};
