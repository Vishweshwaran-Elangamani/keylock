import axios from "axios";

const api_meet = axios.create({
  baseURL: import.meta.env.VITE_MEETING_API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const api_mom = axios.create({
  baseURL: import.meta.env.VITE_MOM_API_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
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

api_meet.interceptors.response.use(
  (response) => response,
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

api_mom.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api_meet;
export { api_mom };
