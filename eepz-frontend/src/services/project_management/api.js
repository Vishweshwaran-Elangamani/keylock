// src/services/api.js
import axios from "axios";
import { Import } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_PROJECT_API_URL+"/api"; // Update with your backend URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
