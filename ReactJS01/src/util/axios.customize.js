import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // Cho phép gửi cookie lên server khác origin
});

// Alter defaults after instance has been created
// Add a request interceptor
instance.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  },
);

// Add a response interceptor
instance.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    if (response && response.data) return response.data;
    return response;
  },
  async function (error) {
    // Xử lý tự động gọi refresh token khi lỗi 401 lấy access token mới khi hết hạn
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // dừng không lặp retry vô hạn
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/v1/api/refresh-token`,
          {},
          { withCredentials: true }, // Cho phép client gửi kèm cookie
        );

        if (res.data && res.data.access_token) {
          localStorage.setItem("access_token", res.data.access_token);
          // Gắn token mới vào header của request bị lỗi
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          // Thực hiện lại request bị lỗi
          return instance(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn, buộc đăng xuất
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Do something with response error
    if (error?.response?.data) return error?.response?.data;
    return Promise.reject(error);
  },
);

export default instance;
