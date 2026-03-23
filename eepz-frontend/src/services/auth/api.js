import axios from "axios";

// 🔧 Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5101/api";

// 🔧 Keycloak config
const KEYCLOAK_URL =
  import.meta.env.VITE_KEYCLOAK_URL ||
  "http://localhost:9090/realms/eepz-realm/protocol/openid-connect/token";

const CLIENT_ID =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "eepz-client";

const CLIENT_SECRET =
  import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET ||
  "CvbX4kQIOjnuCGADmJ2i0VPuDTWLTmQ5";

// 🌐 Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// 🔒 Refresh state (prevents multiple refresh calls)
let isRefreshing = false;
let refreshSubscribers = [];

// 🔁 Subscribe requests while refreshing
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 🔁 Notify all subscribers after refresh
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// 🔐 REQUEST: Attach token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 RESPONSE: Handle errors
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    console.warn(`🔴 API Error ${status} on:`, originalRequest?.url);

    // 🔥 HANDLE 401 (TOKEN EXPIRED)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      // 🚫 No refresh token → logout
      if (!refreshToken) {
        window.dispatchEvent(new Event("auth:force-logout"));
        return Promise.reject(error);
      }

      // 🔒 If already refreshing → queue request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const params = new URLSearchParams();
        params.append("grant_type", "refresh_token");
        params.append("client_id", CLIENT_ID);
        params.append("client_secret", CLIENT_SECRET);
        params.append("refresh_token", refreshToken);

        const res = await axios.post(KEYCLOAK_URL, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token;

        // 💾 Store tokens
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("token", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // 🔁 Update queued requests
        onRefreshed(newAccessToken);

        // 🔁 Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error("🔴 Refresh token failed:", refreshError);

        // 🔥 Logout if refresh fails
        localStorage.clear();
        window.dispatchEvent(new Event("auth:force-logout"));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ⛔ Forbidden
    if (status === 403) {
      console.warn("⛔ Forbidden access");
    }

    return Promise.reject(error);
  }
);

export default api;