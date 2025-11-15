import apii from '../meeting/index'; // ← Use the same API instance as momService
 
const employeeService = {
  // ========= EMPLOYEE OPERATIONS =========
 
  /**
   * Get all active employees
   * Endpoint: GET /api/EmployeeManagement/all
   */
  getAllEmployees: async () => {
    try {
      const response = await apii.get('/EmployeeManagement/all');
      return response.data; // Returns { success: true, data: [...] }
    } catch (error) {
      console.error('Get all employees error:', error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get employee by EmployeeMasterId
   * Endpoint: GET /api/EmployeeManagement/{employeeMasterId}
   */
  getEmployeeById: async (employeeMasterId) => {
    try {
      const response = await apii.get(`/EmployeeManagement/${employeeMasterId}`);
      return response.data; // Returns { success: true, data: {...} }
    } catch (error) {
      console.error(`Get employee ${employeeMasterId} error:`, error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get multiple employees by IDs (batch request)
   * Endpoint: POST /api/EmployeeManagement/batch
   * @param {Array<number>} employeeMasterIds - Array of EmployeeMasterId values
   */
  getEmployeesByIds: async (employeeMasterIds) => {
    try {
      const response = await apii.post('/EmployeeManagement/batch', {
        ids: employeeMasterIds
      });
      return response.data; // Returns { success: true, data: [...], count: n }
    } catch (error) {
      console.error('Batch get employees error:', error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get only managers (for approver dropdowns)
   * Endpoint: GET /api/EmployeeManagement/managers
   */
  getManagers: async () => {
    try {
      const response = await apii.get('/EmployeeManagement/managers');
      return response.data; // Returns { success: true, data: [...] }
    } catch (error) {
      console.error('Get managers error:', error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Search employees by name, email, or company ID
   * Endpoint: GET /api/EmployeeManagement/search?query={query}
   */
  searchEmployees: async (query) => {
    try {
      const response = await apii.get('/EmployeeManagement/search', {
        params: { query }
      });
      return response.data; // Returns { success: true, data: [...], count: n }
    } catch (error) {
      console.error('Search employees error:', error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get employees by department
   * Endpoint: GET /api/EmployeeManagement/department/{departmentId}
   */
  getEmployeesByDepartment: async (departmentId) => {
    try {
      const response = await apii.get(`/EmployeeManagement/department/${departmentId}`);
      return response.data; // Returns { success: true, data: [...], count: n }
    } catch (error) {
      console.error(`Get employees by department ${departmentId} error:`, error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get employees by role
   * Endpoint: GET /api/EmployeeManagement/role/{roleId}
   */
  getEmployeesByRole: async (roleId) => {
    try {
      const response = await apii.get(`/EmployeeManagement/role/${roleId}`);
      return response.data; // Returns { success: true, data: [...], count: n }
    } catch (error) {
      console.error(`Get employees by role ${roleId} error:`, error);
      throw error.response?.data || error;
    }
  },
 
  // ========= DEPARTMENT OPERATIONS =========
 
  /**
   * Get all departments
   * Endpoint: GET /api/EmployeeManagement/departments
   */
  getAllDepartments: async () => {
    try {
      const response = await apii.get('/EmployeeManagement/departments');
      return response.data; // Returns { success: true, data: [...] }
    } catch (error) {
      console.error('Get all departments error:', error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get department by ID
   * Endpoint: GET /api/EmployeeManagement/departments/{departmentId}
   */
  getDepartmentById: async (departmentId) => {
    try {
      const response = await apii.get(`/EmployeeManagement/departments/${departmentId}`);
      return response.data; // Returns { success: true, data: {...} }
    } catch (error) {
      console.error(`Get department ${departmentId} error:`, error);
      throw error.response?.data || error;
    }
  },
 
  /**
   * Get all business units
   * Endpoint: GET /api/EmployeeManagement/business-units
   */
  getAllBusinessUnits: async () => {
    try {
      const response = await apii.get('/EmployeeManagement/business-units');
      return response.data; // Returns { success: true, data: [...] }
    } catch (error) {
      console.error('Get all business units error:', error);
      throw error.response?.data || error;
    }
  },
};
 
export default employeeService;
 
 