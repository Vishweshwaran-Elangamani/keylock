import axios from "axios";
const internalApi = axios.create({
  baseURL: import.meta.env.VITE_INTERNAL_API_URL+"/api",
  headers: {
    "Content-Type": "application/json",
  },
});
internalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);
internalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Internal API Response error:", error);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
    console.error("Response data:", error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
export default internalApi;
