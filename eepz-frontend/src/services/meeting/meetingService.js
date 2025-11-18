import apii from "../../services/meeting/index";

const meetingService = {
  // ========= MEETING SCHEDULING (US059 - Manager) =========

  scheduleMeeting: async (meetingData) => {
    try {
      const response = await apii.post("/Meeting/schedule", meetingData);
      return response.data;
    } catch (error) {
      console.error("Schedule meeting error:", error);
      throw error.response?.data || error;
    }
  },

  getMyMeetings: async () => {
    try {
      const response = await apii.get("/Meeting/my-meetings");
      return response.data;
    } catch (error) {
      console.error("Get my meetings error:", error);
      throw error.response?.data || error;
    }
  },

  getMeetingById: async (meetingId) => {
    try {
      const response = await apii.get(`/Meeting/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error("Get meeting by ID error:", error);
      throw error.response?.data || error;
    }
  },

  // =========== ONE-ON-ONE REPORTS (Manager) ===========

  getOneOnOneReports: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append("employeeId", filters.employeeId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await apii.get(
        `/Meeting/one-on-one-reports?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Get one-on-one reports error:", error);
      throw error.response?.data || error;
    }
  },

  getOneOnOneSummary: async () => {
    try {
      const response = await apii.get("/Meeting/one-on-one-summary");
      return response.data;
    } catch (error) {
      console.error("Get one-on-one summary error:", error);
      throw error.response?.data || error;
    }
  },
};

export default meetingService;
