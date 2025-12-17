
import axios from "axios";

const org_api = axios.create({
  baseURL: import.meta.env.VITE_ORGFEEDBACK_API_URL+"/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

org_api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default org_api;
