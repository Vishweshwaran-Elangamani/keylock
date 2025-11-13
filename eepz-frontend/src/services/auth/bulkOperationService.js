import api from "../api";

const BulkOperationService = {
  // Bulk create users from JSON
  bulkCreateUsers: async (users) => {
    try {
      const response = await api.post("/BulkOperation/bulk-create-users", {
        users: users,
      });
      return response.data;
    } catch (error) {
      console.error("Bulk create users error:", error);
      throw error;
    }
  },

  // Bulk inactivate users
  bulkInactivateUsers: async (userIds) => {
    try {
      const response = await api.post("/BulkOperation/bulk-inactivate-users", {
        userIds: userIds,
      });
      return response.data;
    } catch (error) {
      console.error("Bulk inactivate users error:", error);
      throw error;
    }
  },

  // Bulk create users from Excel
  bulkCreateUsersFromExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/BulkOperation/bulk-create-from-excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Bulk create from Excel error:", error);
      throw error;
    }
  },

  //  CRITICAL: Download Excel Template
  downloadExcelTemplate: async () => {
    try {
      const response = await api.get("/BulkOperation/download-template", {
        responseType: "blob",
      });

      // Create blob from response
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `BulkUserImportTemplate_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return { success: true, message: "Template downloaded successfully" };
    } catch (error) {
      console.error("Download template error:", error);
      throw error;
    }
  },
};

export default BulkOperationService;
