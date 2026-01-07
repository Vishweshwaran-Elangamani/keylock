import axios from "axios";

const api_meet = axios.create({
  baseURL: import.meta.env.VITE_MEETING_API_URL + "/api",
});

const api_mom = axios.create({
  baseURL: import.meta.env.VITE_MOM_API_URL + "/api",
});

api_meet.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api_mom.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api_meet;
