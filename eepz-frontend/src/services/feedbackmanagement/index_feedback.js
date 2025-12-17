
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_FEEDBACK_API_URL+"/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
