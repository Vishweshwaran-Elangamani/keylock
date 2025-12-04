import axios from "axios";
import authService from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL+"/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL FIX: Remove Content-Type for FormData
    // Browser will automatically set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      
      // Also remove from other header types if present
      if (config.headers.common) {
        delete config.headers.common["Content-Type"];
      }
      if (config.headers.put) {
        delete config.headers.put["Content-Type"];
      }
      if (config.headers.post) {
        delete config.headers.post["Content-Type"];
      }
      
      console.log("✓ FormData detected - Content-Type header removed");
      console.log("✓ Browser will set: multipart/form-data with boundary");
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error("Response error:", error);
    console.error("Status:", error.response?.status);
    console.error("URL:", error.config?.url);
    console.error("Data:", error.response?.data);

    const originalRequest = error.config;

    // Only attempt token refresh if:
    // 1. Status is 401
    // 2. Request has not been retried yet
    // 3. Request is NOT login/register/public endpoint
    // 4. User has a refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/register") &&
      !originalRequest.url.includes("/forgot-password") &&
      !originalRequest.url.includes("/reset-password") &&
      authService.getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        console.log("Attempting token refresh...");
        const refreshResponse = await authService.refreshAccessToken();

        if (refreshResponse.success) {
          console.log("Token refreshed successfully");
          originalRequest.headers.Authorization = `Bearer ${authService.getToken()}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        authService.clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
