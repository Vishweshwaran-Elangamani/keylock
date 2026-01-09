import axios from "axios";
const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;

const employeeService = {
  getAllEmployees: () => axios.get(`${PROJECT_API_URL}/api/employeemanagement/all`),

  getById: (employeeId) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/${employeeId}`),
 
  getByDepartment: (departmentId) =>
    axios.get(
      `${PROJECT_API_URL}/api/employeemanagement/department/${departmentId}`
    ),

  getByRole: (roleId) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/role/${roleId}`),
 
  search: (query) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/search`, {
      params: { q: query },
    }),
 
  getSubordinates: async () => {
    try {
      // Get access token from storage (adjust as needed)
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${LND_API_URL}/api/lnd-skills/employees/subordinates`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Get subordinates error:", error);
      throw error.response?.data || error;
    }
  },
};

export default employeeService


