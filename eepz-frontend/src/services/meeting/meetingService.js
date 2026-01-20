import api_meet from "../../services/meeting/index_meet";
import axios from "axios";

const meetingService = {
  scheduleMeeting: async (meetingData) => {
    try {
      const response = await api_meet.post("/meetings", meetingData);
      return response.data;
    } catch (error) {
      console.error("Schedule meeting error:", error);
      throw error.response?.data || error;
    }
  },

  getMyMeetings: async (pageNumber = 1, pageSize = 20) => {
    try {
      const response = await api_meet.get("/meetings/my", {
        params: { pageNumber, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error("Get my meetings error:", error);
      throw error.response?.data || error;
    }
  },

  getMeetingById: async (meetingId) => {
    try {
      const response = await api_meet.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error("Get meeting by ID error:", error);
      throw error.response?.data || error;
    }
  },

  getOneOnOneReports: async (filters = {}) => {
    try {
      const response = await api_meet.get("/meetings/one-on-one-reports", {
        params: {
          employeeId: filters.employeeId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Get one-on-one reports error:", error);
      throw error.response?.data || error;
    }
  },

  getOneOnOneSummary: async () => {
    try {
      const response = await api_meet.get("/meetings/one-on-one-summary");
      return response.data;
    } catch (error) {
      console.error("Get one-on-one summary error:", error);
      throw error.response?.data || error;
    }
  },

  getMyInvitations: async () => {
    try {
      const response = await api_meet.get("/meetings/invitations");
      return response.data;
    } catch (error) {
      console.error("Get my invitations error:", error);
      throw error.response?.data || error;
    }
  },

  submitRsvp: async (rsvpData) => {
    try {
      const response = await api_meet.post("/rsvp", rsvpData);
      return response.data;
    } catch (error) {
      console.error("Submit RSVP error:", error);
      throw error.response?.data || error;
    }
  },

  updateRsvp: async (meetingId, rsvpData) => {
    try {
      const response = await api_meet.put(`/rsvp/${meetingId}`, rsvpData);
      return response.data;
    } catch (error) {
      console.error("Update RSVP error:", error);
      throw error.response?.data || error;
    }
  },

  getPendingRsvpCount: async () => {
    try {
      const response = await api_meet.get("/rsvp/pending-count");
      return response.data;
    } catch (error) {
      console.error("Get pending RSVP count error:", error);
      throw error.response?.data || error;
    }
  },

  getMeetingRsvpSummary: async (meetingId) => {
    try {
      const response = await api_meet.get(`/rsvp/${meetingId}/summary`);
      return response.data;
    } catch (error) {
      console.error("Get meeting RSVP summary error:", error);
      throw error.response?.data || error;
    }
  },

  getSubordinates: async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const response = await axios.get(
        `${import.meta.env.VITE_LND_API_URL}/api/LnD/employees/subordinates`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Get subordinates error:", error);
      throw error.response?.data || error;
    }
  },
};

export default meetingService;
