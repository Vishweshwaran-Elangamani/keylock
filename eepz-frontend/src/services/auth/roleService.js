import api from "./api";

const roleService = {
  getAllRoles: async () => {
    try {
      const response = await api.get("/RoleDepartmentManagement/role/all");
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  getRoleById: async (roleId) => {
    try {
      const response = await api.get(`/RoleDepartmentManagement/role/${roleId}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await api.post("/RoleDepartmentManagement/role/create", roleData);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  updateRole: async (roleData) => {
    try {
      const response = await api.put("/RoleDepartmentManagement/role/update", roleData);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },

  deleteRole: async (Id) => {
    try {
      const response = await api.delete(`/RoleDepartmentManagement/role/${Id}`);
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      throw new Error(errorMessage);
    }
  },
};

// Helper function to extract error message from different error formats
const extractErrorMessage = (error) => {
  // Check for custom ApiResponseDto format (your backend)
  if (error.response?.data?.Message) {
    return error.response.data.Message;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for ASP.NET Core validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const errorMessages = [];
    
    for (const field in errors) {
      if (Array.isArray(errors[field])) {
        errorMessages.push(...errors[field]);
      } else {
        errorMessages.push(errors[field]);
      }
    }
    
    return errorMessages.join('. ');
  }

  // Check for ASP.NET Core title
  if (error.response?.data?.title) {
    return error.response.data.title;
  }

  // Fallback to generic error message
  return error.message || 'An error occurred';
};

export default roleService;
