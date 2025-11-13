import hrApi from "./hrApi";

const policyService = {
  // Get all policies
  getAllPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/list");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching policies:", error);
      throw error;
    }
  },

  // Get active policies
  getActivePolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/active");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching active policies:", error);
      throw error;
    }
  },

  // Get inactive policies
  getInactivePolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/inactive");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching inactive policies:", error);
      throw error;
    }
  },

  //   Get published policies
  getPublishedPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/published");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching published policies:", error);
      throw error;
    }
  },

  //  Get draft policies
  getDraftPolicies: async () => {
    try {
      const response = await hrApi.get("/Policy/drafts");
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching draft policies:", error);
      throw error;
    }
  },

  // Get policy by ID
  getPolicyById: async (policyId) => {
    try {
      const response = await hrApi.get(`/Policy/${policyId}`);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching policy:", error);
      throw error;
    }
  },

  // Create new policy
  createPolicy: async (policyData) => {
    try {
      const response = await hrApi.post("/Policy/create", policyData);
      return response.data;
    } catch (error) {
      console.error("Error creating policy:", error);
      throw error;
    }
  },

  // Update policy
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

  // Delete policy
  deletePolicy: async (policyId) => {
    try {
      const response = await hrApi.delete(`/Policy/${policyId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting policy:", error);
      throw error;
    }
  },

  //  Upload document (file)
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

  // Add document link
  addDocumentLink: async (documentUrl, documentName) => {
    try {
      const formData = new FormData();
      formData.append("documentUrl", documentUrl);
      formData.append("documentName", documentName);
      formData.append("documentType", "link");

      const response = await hrApi.post("/Policy/upload-document", formData);
      return response.data.data;
    } catch (error) {
      console.error("Error adding document link:", error);
      throw error;
    }
  },

  //  Publish policy
  publishPolicy: async (policyId) => {
    try {
      console.log(` Publishing policy ID: ${policyId}`);
      const response = await hrApi.post(`/Policy/publish/${policyId}`);
      console.log(` Policy published successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(" Error publishing policy:", error);
      throw error;
    }
  },

  //  Unpublish policy
  unpublishPolicy: async (policyId) => {
    try {
      console.log(` Unpublishing policy ID: ${policyId}`);
      const response = await hrApi.post(`/Policy/unpublish/${policyId}`);
      console.log(` Policy unpublished successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(" Error unpublishing policy:", error);
      throw error;
    }
  },
};

export default policyService;
