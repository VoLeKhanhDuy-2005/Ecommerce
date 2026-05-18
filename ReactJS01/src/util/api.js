import axios from "./axios.customize";

const createUserApi = (name, email, password) => {
  const URL_API = "/v1/api/register";
  const data = {
    name,
    email,
    password,
  };

  return axios.post(URL_API, data);
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

const getProductsApi = () => {
  const URL_API = "/v1/api/products";
  return axios.get(URL_API);
};

const getActivePromotionsApi = () => {
    return axios.get('/v1/api/promotions/active');
};

export { createUserApi, loginApi, getUserApi, getCurrentUserApi, getProductsApi, getActivePromotionsApi };
