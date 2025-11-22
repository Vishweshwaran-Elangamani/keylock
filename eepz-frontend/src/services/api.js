import axios from "axios";
import authService from "./auth/authService";

const api = axios.create({
  baseURL: "http://localhost:5121/api",
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
// Add this new function!



export default api;
