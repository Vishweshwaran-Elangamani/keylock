import internalApi from "../internalApi";

const API_BASE = "InternalOpportunity";

const internalOpportunityService = {
  // ✅ Get all opportunities - NO filters, NO pagination
  getAllOpportunities: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}`);
      
      console.log("Raw response:", response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get all opportunities error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch opportunities",
      };
    }
  },

  // Get opportunity by ID
  getOpportunityById: async (id) => {
    try {
      const response = await internalApi.get(`/${API_BASE}/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch opportunity",
      };
    }
  },

  // Create new opportunity (HR only)
  createOpportunity: async (opportunityData) => {
    try {
      const response = await internalApi.post(`/${API_BASE}/create`, opportunityData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Create opportunity error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create opportunity",
      };
    }
  },

  // Update opportunity (HR only)
  updateOpportunity: async (id, opportunityData) => {
    try {
      const response = await internalApi.put(`/${API_BASE}/update/${id}`, opportunityData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update opportunity",
      };
    }
  },

  // Delete opportunity (HR only)
  deleteOpportunity: async (id) => {
    try {
      await internalApi.delete(`/${API_BASE}/${id}`);
      return {
        success: true,
        message: "Opportunity deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete opportunity",
      };
    }
  },

  // Get active opportunities
  getActiveOpportunities: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/active`);
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch active opportunities",
      };
    }
  },

  // Get statistics
  getStatistics: async () => {
    try {
      const response = await internalApi.get(`/${API_BASE}/statistics`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch statistics",
      };
    }
  },
};

export default internalOpportunityService;

// import internalApi from "../internalApi";

// const API_BASE = "InternalOpportunity";

// const internalOpportunityService = {
//   // ✅ SIMPLIFIED: Get all opportunities - NO filters, NO pagination
//   getAllOpportunities: async () => {
//     try {
//       const response = await internalApi.get(`/${API_BASE}`);
      
//       console.log("Raw response:", response.data); // Debug
      
//       return {
//         success: true,
//         data: response.data, // Returns List<InternalOpportunityResponseDto>
//       };
//     } catch (error) {
//       console.error("Get all opportunities error:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to fetch opportunities",
//       };
//     }
//   },

//   // Get opportunity by ID
//   getOpportunityById: async (id) => {
//     try {
//       const response = await internalApi.get(`/${API_BASE}/${id}`);
//       return {
//         success: true,
//         data: response.data,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to fetch opportunity",
//       };
//     }
//   },

//   // Create new opportunity
//   createOpportunity: async (opportunityData) => {
//     try {
//       const response = await internalApi.post(`/${API_BASE}/create`, opportunityData);
//       return {
//         success: true,
//         data: response.data,
//       };
//     } catch (error) {
//       console.error("Create opportunity error:", error);
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to create opportunity",
//       };
//     }
//   },

//   // Update opportunity
//   updateOpportunity: async (id, opportunityData) => {
//     try {
//       const response = await internalApi.put(`/${API_BASE}/update/${id}`, opportunityData);
//       return {
//         success: true,
//         data: response.data,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to update opportunity",
//       };
//     }
//   },

//   // Delete opportunity
//   deleteOpportunity: async (id) => {
//     try {
//       await internalApi.delete(`/${API_BASE}/${id}`);
//       return {
//         success: true,
//         message: "Opportunity deleted successfully",
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to delete opportunity",
//       };
//     }
//   },

//   // Get active opportunities
//   getActiveOpportunities: async () => {
//     try {
//       const response = await internalApi.get(`/${API_BASE}/active`);
//       return {
//         success: true,
//         data: response.data,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to fetch active opportunities",
//       };
//     }
//   },

//   // Get statistics
//   getStatistics: async () => {
//     try {
//       const response = await internalApi.get(`/${API_BASE}/statistics`);
//       return {
//         success: true,
//         data: response.data,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message: error.response?.data?.message || "Failed to fetch statistics",
//       };
//     }
//   },
// };

// export default internalOpportunityService;
