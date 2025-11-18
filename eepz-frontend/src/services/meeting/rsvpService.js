import apii from "../../services/meeting/index";

const rsvpService = {
  // Get all invitations for current user
  getMyInvitations: async () => {
    try {
      const response = await apii.get("/Rsvp/my-invitations");
      return response.data;
    } catch (error) {
      console.error("Get my invitations error:", error);
      throw error.response?.data || error;
    }
  },

  // Submit RSVP response
  submitRsvp: async (rsvpData) => {
    try {
      const response = await apii.post("/Rsvp/submit", rsvpData);
      return response.data;
    } catch (error) {
      console.error("Submit RSVP error:", error);
      throw error.response?.data || error;
    }
  },

  // Update RSVP by meeting ID (could be used for batch updates)
  updateRsvp: async (meetingId, rsvpData) => {
    try {
      const response = await apii.put(`/Rsvp/${meetingId}/update`, rsvpData);
      return response.data;
    } catch (error) {
      console.error("Update RSVP error:", error);
      throw error.response?.data || error;
    }
  },

  // Get count of pending RSVPs for current user
  getPendingRsvpCount: async () => {
    try {
      const response = await apii.get("/Rsvp/pending-count");
      return response.data;
    } catch (error) {
      console.error("Get pending RSVP count error:", error);
      throw error.response?.data || error;
    }
  },

  // Get RSVP summary for a specific meeting
  getMeetingRsvpSummary: async (meetingId) => {
    try {
      const response = await apii.get(`/Rsvp/meeting/${meetingId}/summary`);
      return response.data;
    } catch (error) {
      console.error("Get RSVP summary error:", error);
      throw error.response?.data || error;
    }
  },

  // Update participant RSVP by participant ID (for individual participant update)
  updateParticipantRsvp: async (participantId, rsvpStatus) => {
    try {
      const response = await apii.patch(
        `/Rsvp/participant/${participantId}/update`,
        { rsvpStatus },
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      console.error("Update participant RSVP error:", error);
      throw error.response?.data || error;
    }
  },
};

export default rsvpService;
