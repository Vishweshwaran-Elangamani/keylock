import hrApi from "./hrApi";
const policyService = {
  getAllPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/list");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching policies:", error);
      throw error;
    }
  },
  getActivePolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/active");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching active policies:", error);
      throw error;
    }
  },
  getInactivePolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/inactive");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching inactive policies:", error);
      throw error;
    }
  },
  getPublishedPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/published");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching published policies:", error);
      throw error;
    }
  },
  getDraftPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/drafts");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching draft policies:", error);
      throw error;
    }
  },
  getPolicyById: async (policyId) => {
    try {
      const response = await hrApi.get(`/Policy/${policyId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching policy:", error);
      throw error;
    }
  },
  createPolicy: async (policyData) => {
    try {
      const response = await hrApi.post("/Policy/create", policyData);
      return response.data;
    } catch (error) {
      console.error("Error creating policy:", error);
      throw error;
    }
  },
  updatePolicy: async (policyId, policyData) => {
    try {
      const response = await hrApi.put(
        `/Policy/update/${policyId}`,
        policyData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating policy:", error);
      throw error;
    }
  },
  deletePolicy: async (policyId) => {
    try {
      const response = await hrApi.delete(`/Policy/${policyId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting policy:", error);
      throw error;
    }
  },
  uploadDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "upload");
      const response = await hrApi.post("/Policy/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },
  addDocumentLink: async (documentUrl, documentName) => {
  try {
    const formData = new FormData();
    formData.append("documentUrl", documentUrl);
    formData.append("documentName", documentName);
    formData.append("documentType", "link");
    
    const response = await hrApi.post("/Policy/upload-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data.data;
  } catch (error) {
    console.error("Error adding document link:", error);
    throw error;
  }
},

  publishPolicy: async (policyId) => {
    try {
      const response = await hrApi.post(`/Policy/publish/${policyId}`);
      return response.data;
    } catch (error) {
      console.error(" Error publishing policy:", error);
      throw error;
    }
  },
  unpublishPolicy: async (policyId) => {
    try {
      const response = await hrApi.post(`/Policy/unpublish/${policyId}`);
      return response.data;
    } catch (error) {
      console.error(" Error unpublishing policy:", error);
      throw error;
    }
  },
};
export default policyService;
