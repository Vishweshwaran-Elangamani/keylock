import axios from "axios";

const apii = axios.create({
  baseURL: "http://localhost:5444/api",
});

// Add a request interceptor to include authorization header with token from localStorage
apii.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apii;
