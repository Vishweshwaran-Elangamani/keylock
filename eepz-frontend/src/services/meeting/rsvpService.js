import apii from "./index_meet";

const handleApiError = (error, context) => {
  console.error(`${context} error:`, error);
  const apiError = error?.response?.data;
  throw apiError || error;
};

const rsvpService = {
  getMyInvitations: async () => {
    try {
      const response = await apii.get("/rsvp/my-invitations");
      return response.data;
    } catch (error) {
      handleApiError(error, "Get my invitations");
    }
  },

  submitRsvp: async (rsvpData) => {
    try {
      const response = await apii.post("/rsvp", rsvpData);
      return response.data;
    } catch (error) {
      handleApiError(error, "Submit RSVP");
    }
  },

  updateParticipantRsvp: async (meetingId, rsvpData) => {
    try {
      const response = await apii.put(`/rsvp/${meetingId}`, rsvpData, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, "Update participant RSVP");
    }
  },

  getPendingRsvpCount: async () => {
    try {
      const response = await apii.get("/rsvp/pending-count");
      return response.data;
    } catch (error) {
      handleApiError(error, "Get pending RSVP count");
    }
  },

  getMeetingRsvpSummary: async (meetingId) => {
    try {
      const response = await apii.get(`/rsvp/${meetingId}/summary`);
      return response.data;
    } catch (error) {
      handleApiError(error, "Get meeting RSVP summary");
    }
  },
};

export default rsvpService;
