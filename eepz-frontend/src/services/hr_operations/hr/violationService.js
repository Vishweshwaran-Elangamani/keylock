import hrApi from "./hrApi";
const violationService = {
  reportViolation: async (violationData) => {
    try {
      const response = await hrApi.post("/Violation/report", violationData);
      return response.data;
    } catch (error) {
      console.error("Error reporting violation:", error);
      throw error.response?.data || { message: "Failed to report violation" };
    }
  },
  getAllViolations: async () => {
    try {
      const response = await hrApi.get("/Violation/list");
      return response.data;
    } catch (error) {
      console.error("Error fetching violations:", error);
      throw error.response?.data || { message: "Failed to fetch violations" };
    }
  },
  getViolationById: async (violationId) => {
    try {
      const response = await hrApi.get(`/Violation/${violationId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching violation:", error);
      throw error.response?.data || { message: "Failed to fetch violation" };
    }
  },
  getViolationsByEmployee: async (employeeUserId) => {
    try {
      const response = await hrApi.get(`/Violation/employee/${employeeUserId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching employee violations:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch employee violations",
        }
      );
    }
  },
  getViolationsByPolicy: async (policyId) => {
    try {
      const response = await hrApi.get(`/Violation/policy/${policyId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching policy violations:", error);
      throw (
        error.response?.data || { message: "Failed to fetch policy violations" }
      );
    }
  },
  resolveViolation: async (violationId, resolutionData) => {
    try {
      const response = await hrApi.put(
        `/Violation/resolve/${violationId}`,
        resolutionData
      );
      return response.data;
    } catch (error) {
      console.error("Error resolving violation:", error);
      throw error.response?.data || { message: "Failed to resolve violation" };
    }
  },
  getViolationStats: async () => {
    try {
      const response = await hrApi.get("/Violation/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching violation stats:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch violation statistics",
        }
      );
    }
  },
  getAllSlaEscalations: async () => {
    try {
      const response = await hrApi.get("/Violation/sla-escalations");
      return response.data;
    } catch (error) {
      console.error("Error fetching SLA escalations:", error);
      throw (
        error.response?.data || { message: "Failed to fetch SLA escalations" }
      );
    }
  },
  getSlaEscalationsByEmployee: async (employeeUserId) => {
    try {
      const response = await hrApi.get(
        `/Violation/sla-escalations/employee/${employeeUserId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching employee SLA escalations:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch employee SLA escalations",
        }
      );
    }
  },
  getSlaEscalationById: async (escalationId) => {
    try {
      const response = await hrApi.get(
        `/Violation/sla-escalations/${escalationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching SLA escalation details:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch escalation details",
        }
      );
    }
  },
  getCombinedData: async () => {
    try {
      const response = await hrApi.get("/Violation/combined");
      return response.data;
    } catch (error) {
      console.error("Error fetching combined data:", error);
      throw (
        error.response?.data || { message: "Failed to fetch combined data" }
      );
    }
  },
  getSlaEscalationStats: async () => {
    try {
      const response = await hrApi.get("/Violation/sla-escalations/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching SLA escalation stats:", error);
      throw (
        error.response?.data || {
          message: "Failed to fetch SLA escalation statistics",
        }
      );
    }
  },
};
export default violationService;
