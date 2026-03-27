import api_meet from "./index_meet";
import axios from "axios";

const meetingService = {
  scheduleMeeting: async (data) => {
    const res = await api_meet.post("/meetings", data);
    return res.data;
  },

  suggestMeeting: async (data) => {
    const res = await api_meet.post("/meetings/suggest", data);
    return res.data;
  },

  getMyMeetings: async (pageNumber = 1, pageSize = 20) => {
    const res = await api_meet.get("/meetings/my", {
      params: { pageNumber, pageSize },
    });
    return res.data;
  },

  getMeetingById: async (id) => {
    const res = await api_meet.get(`/meetings/${id}`);
    return res.data;
  },

  getMyInvitations: async () => {
    const res = await api_meet.get("/meetings/invitations");
    return res.data;
  },

  submitRsvp: async (data) => {
    const res = await api_meet.post("/meetings/rsvp", data);
    return res.data;
  },
};

export default meetingService;
