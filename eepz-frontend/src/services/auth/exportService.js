import api from "./api";

const ExportService = {
  exportRoles: async () => {
    try {
      const response = await api.get("/BulkOperation/export/roles", {
        responseType: "blob",
      });
      
      const password = response.headers["x-export-password"];
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Roles_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true, 
        message: "Roles exported successfully",
        password: password 
      };
    } catch (error) {
      console.error("Error exporting roles:", error);
      throw error.response?.data || { message: "Failed to export roles" };
    }
  },

  exportDepartments: async () => {
    try {
      const response = await api.get("/BulkOperation/export/departments", {
        responseType: "blob",
      });
      
      const password = response.headers["x-export-password"];
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Departments_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true, 
        message: "Departments exported successfully",
        password: password 
      };
    } catch (error) {
      console.error("Error exporting departments:", error);
      throw error.response?.data || { message: "Failed to export departments" };
    }
  },

  exportUsers: async () => {
    try {
      const response = await api.get("/BulkOperation/export/users", {
        responseType: "blob",
      });
      
      const password = response.headers["x-export-password"];
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Users_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true, 
        message: "Users exported successfully",
        password: password 
      };
    } catch (error) {
      console.error("Error exporting users:", error);
      throw error.response?.data || { message: "Failed to export users" };
    }
  },

  exportAllData: async () => {
    try {
      const response = await api.get("/BulkOperation/export/all-data", {
        responseType: "blob",
      });
      
      const password = response.headers["x-export-password"];
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `EEPZ_Complete_Export_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true, 
        message: "All data exported successfully",
        password: password 
      };
    } catch (error) {
      console.error("Error exporting all data:", error);
      throw error.response?.data || { message: "Failed to export all data" };
    }
  },
};

export default ExportService;
