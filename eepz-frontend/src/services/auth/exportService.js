import api from "./api";

const ExportService = {
  // Export Roles
  exportRoles: async () => {
    try {
      const response = await api.get("/Export/roles", {
        responseType: "blob",
      });

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

      return { success: true, message: "Roles exported successfully" };
    } catch (error) {
      console.error("Error exporting roles:", error);
      throw error.response?.data || { message: "Failed to export roles" };
    }
  },

  // Export Departments
  exportDepartments: async () => {
    try {
      const response = await api.get("/Export/departments", {
        responseType: "blob",
      });

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

      return { success: true, message: "Departments exported successfully" };
    } catch (error) {
      console.error("Error exporting departments:", error);
      throw error.response?.data || { message: "Failed to export departments" };
    }
  },

  // Export Users
  exportUsers: async () => {
    try {
      const response = await api.get("/Export/users", {
        responseType: "blob",
      });

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

      return { success: true, message: "Users exported successfully" };
    } catch (error) {
      console.error("Error exporting users:", error);
      throw error.response?.data || { message: "Failed to export users" };
    }
  },

  // Export All Data
  exportAllData: async () => {
    try {
      const response = await api.get("/Export/all-data", {
        responseType: "blob",
      });

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

      return { success: true, message: "All data exported successfully" };
    } catch (error) {
      console.error("Error exporting all data:", error);
      throw error.response?.data || { message: "Failed to export all data" };
    }
  },
};

export default ExportService;
