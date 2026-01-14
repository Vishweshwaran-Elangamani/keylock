import axios from "axios";
const employeeApi = axios.create({
  baseURL: import.meta.env.VITE_HR_API_URL+"/api",
  headers: {
    "Content-Type": "application/json",
  },
});
employeeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
const employeePolicyService = {
  getPublishedPolicies: async () => {
    try {
      const response = await employeeApi.get("/EmployeeData/policy/published");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching published policies:", error);
      throw error;
    }
  },
  getPolicyById: async (policyId) => {
    try {
      const response = await employeeApi.get(`/EmployeeData/policy/${policyId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching policy ${policyId}:`, error);
      throw error;
    }
  },
  getFullDocumentUrl: (url) => {
    if (!url) {
      console.warn("Empty document URL provided");
      return "";
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const hrBaseUrl =import.meta.env.VITE_HR_API_URL;
    const fileName = url.split('/').pop();
    const fullUrl = `${hrBaseUrl}/api/policy/document/${fileName}`;
    return fullUrl;
  },
};
export default employeePolicyService;
