import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_HR_API_URL+"/api/employee";

const employeeApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

employeeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("JWT Token attached to Employee API request");
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
      console.log("Fetching published policies from /EmployeePolicy/published");
      const response = await employeeApi.get("/EmployeePolicy/published");
      console.log("Published policies fetched:", response.data);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching published policies:", error);
      throw error;
    }
  },

  getPolicyById: async (policyId) => {
    try {
      console.log(`Fetching policy ${policyId} from /EmployeePolicy/${policyId}`);
      const response = await employeeApi.get(`/EmployeePolicy/${policyId}`);
      console.log(`Policy ${policyId} fetched:`, response.data);
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
    
    // If already a full URL (starts with http/https), return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log("Full URL detected:", url);
      return url;
    }
    
    //  FIXED: Use HR API base URL (port 5260)
    const hrBaseUrl = import.meta.env.VITE_HR_API_URL || "http://localhost:5260";
    
    // Extract filename from paths like "/uploads/policies/abc.pdf"
    const fileName = url.split('/').pop();
    
    // Build document endpoint URL
    const fullUrl = `${hrBaseUrl}/api/policy/document/${fileName}`;
    
    console.log(`Converted relative URL: ${url} → ${fullUrl}`);
    return fullUrl;
  },
};

export default employeePolicyService;
