import axios from "axios";

const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;
const LND_API_URL = import.meta.env.VITE_LND_API_URL;

const employeeService = {
  getAllEmployees: async () => {
    const res = await axios.get(`${PROJECT_API_URL}/api/employees/allEmployees`);
    return res.data;
  },
  base: `${PROJECT_API_URL}/api/employees`,

  getEmployees: (params = {}) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, { params }),

  getAllEmployees: () => axios.get(`${PROJECT_API_URL}/api/employees`),

  getManagers: async () => {
    const res = await axios.get(`${PROJECT_API_URL}/api/employees/managers`);
    return res.data;
  },
  getManagers: () =>
    axios.get(`${PROJECT_API_URL}/api/employees`, {
      params: { isManager: true },
    }),

  getById: async (employeeId) => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/employeeId/${employeeId}`
    );
    return res.data;
  },
  getById: (employeeId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/${employeeId}`),

  getByDepartment: async (departmentId) => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/department/${departmentId}`
    );
    return res.data;
  },

  getByRole: async (roleId) => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/role/${roleId}`
    );
    return res.data;
  },
  getByRole: (roleId) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, {
      params: { roleId },
    }),

  search: async (searchTerm) => {
    const res = await axios.get(`${PROJECT_API_URL}/api/employees/search`, {
      params: { searchTerm },
    });
    return res.data;
  },

  getAllDepartments: async () => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/departments`
    );
    return res.data;
  },

  getAllBusinessUnits: async () => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/business-units`
    );
    return res.data;
  },

  getInitialStageEmployees: async () => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/initial-stage`
    );
    return res.data;
  },

  mapToResourcePool: async (employeeMasterIds) => {
    const res = await axios.post(
      `${PROJECT_API_URL}/api/employees/map-to-resource-pool`,
      { employeeMasterIds }
    );
    return res.data;
  },

  getDepartmentById: async (departmentId) => {
    const res = await axios.get(
      `${PROJECT_API_URL}/api/employees/departments/${departmentId}`
    );
    return res.data;
  },

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
