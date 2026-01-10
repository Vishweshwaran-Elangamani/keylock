import axios from "axios";

const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;
const LND_API_URL = import.meta.env.VITE_LND_API_URL;

const employeeService = {
  base: `${PROJECT_API_URL}/api/employees`,

  getAllEmployees: () => axios.get(`${PROJECT_API_URL}/api/employees/allEmployees`),

  getManagers: () => axios.get(`${PROJECT_API_URL}/api/employees/managers`),

  getById: (employeeId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/employeeId/${employeeId}`),

  getByDepartment: (departmentId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/department/${departmentId}`),

  getByRole: (roleId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/role/${roleId}`),

  search: (searchTerm) =>
    axios.get(`${PROJECT_API_URL}/api/employees/search`, {
      params: { searchTerm },
    }),

  getAllDepartments: () => axios.get(`${PROJECT_API_URL}/api/employees/departments`),

  getAllBusinessUnits: () =>
    axios.get(`${PROJECT_API_URL}/api/employees/business-units`),

  getInitialStageEmployees: () =>
    axios.get(`${PROJECT_API_URL}/api/employees/initial-stage`),

  mapToResourcePool: (employeeMasterIds) =>
    axios.post(`${PROJECT_API_URL}/api/employees/map-to-resource-pool`, {
      employeeMasterIds,
    }),

  getDepartmentById: (departmentId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/departments/${departmentId}`),

  getSubordinates: async () => {
    try {
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

export default employeeService;
