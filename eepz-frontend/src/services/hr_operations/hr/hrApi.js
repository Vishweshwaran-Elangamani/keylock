import axios from "axios";

// Create separate Axios instance for HR Operations API
const hrApi = axios.create({
  baseURL:
    import.meta.env.VITE_HR_API_URL+"/api",
  headers: {
    "Content-Type": "application/json",
  },
});

//  Request Interceptor - Add JWT token to all HR API requests
hrApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn(" No JWT token found in localStorage");
    }
    return config;
  },
  (error) => {
    console.error(" HR API Request Error:", error);
    return Promise.reject(error);
  }
);

//  Response Interceptor - Handle HR API responses
hrApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      " HR API Response Error:",
      error.response?.status,
      error.response?.data
    );

    // Handle HR-specific errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error(" HR API: Unauthorized - JWT token invalid or expired");
          //  Clear token and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          window.location.href = "/login";
          break;
        case 403:
          console.error(" HR API: Forbidden - Insufficient permissions");
          break;
        case 404:
          console.error(" HR API: Resource not found");
          break;
        case 500:
          console.error(" HR API: Server error");
          break;
        default:
          console.error(` HR API Error: ${status}`, data);
      }
    } else if (error.request) {
      console.error(" HR API: No response received from server");
    } else {
      console.error(" HR API: Request setup error", error.message);
    }

    return Promise.reject(error);
  }
);

export default hrApi;
