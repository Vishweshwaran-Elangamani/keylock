// src/services/feedbackmanagement/feedbackApi.js
import api from "./index_feedback";
import axios from "axios";
import org_api from "./index_org";


// Manager Reviews
export const managerReviewApi = {
  create: (body) => api.post("/managerreview/create", body),
  getById: (id) => api.get(`/managerreview/${id}`),
  getByManager: (managerId) => api.get(`/managerreview/manager/${managerId}`),
  getForTarget: (employeeId) => api.get(`/managerreview/target/${employeeId}`),
  update: (id, body) => api.put(`/managerreview/${id}`, body),
  submit: (id) => api.post(`/managerreview/${id}/submit`),
  modify: (id) => api.post(`/managerreview/${id}/modify`),
  finalize: (id) => api.post(`/managerreview/${id}/finalize`),
  remove: (id) => api.delete(`/managerreview/${id}`),
  list: (page = 1, size = 20) =>
    api.get("/managerreview/all", {
      params: { pageNumber: page, pageSize: size },
    }),
  byStatus: (status) => api.get(`/managerreview/status/${status}`),
};

// Mentor Feedback (Employee -> SME)
export const mentorFeedbackApi = {
  create: (body) => org_api.post("/mentorfeedback/create", body),
  getById: (id) => org_api.get(`/mentorfeedback/${id}`),
  aboutMe: (mentorId) => org_api.get(`/mentorfeedback/about-me/${mentorId}`),
  myFeedback: (menteeId) => org_api.get(`/mentorfeedback/my-feedback/${menteeId}`),
  update: (id, body) => org_api.put(`/mentorfeedback/${id}`, body),
  acknowledge: (id) => org_api.post(`/mentorfeedback/${id}/acknowledge`),
  remove: (id) => org_api.delete(`/mentorfeedback/${id}`),
  list: (page = 1, size = 20) =>
    org_api.get("/mentorfeedback/all", {
      params: { pageNumber: page, pageSize: size },
    }),
};

// Org Goal Feedback
export const orgGoalFeedbackApi = {
  create: (body) => org_api.post("/orggoalfeedback/create", body),
  getById: (id) => org_api.get(`/orggoalfeedback/${id}`),
  getByObjective: (objectiveId) =>
    org_api.get(`/orggoalfeedback/goal/${objectiveId}`),
  update: (id, body) => org_api.put(`/orggoalfeedback/${id}`, body),
  remove: (id) => api.delete(`/orggoalfeedback/${id}`),
  list: (page = 1, size = 20) =>
    org_api.get("/orggoalfeedback/all", {
      params: { pageNumber: page, pageSize: size },
    }),
};

// Peer Feedback Queue (HR Approval)
export const peerQueueApi = {
  create: (body) => api.post("/peerfeedbackqueue/create", body),
  getById: (id) => api.get(`/peerfeedbackqueue/${id}`),
  approve: (id, { isProfessional, isRelevant, approvedByHRId }) =>
    api.post(`/peerfeedbackqueue/${id}/approve`, null, {
      params: { isProfessional, isRelevant, approvedByHRId },
    }),
  reject: (id, { rejectedByHRId }) =>
    api.post(`/peerfeedbackqueue/${id}/reject`, null, {
      params: { rejectedByHRId },
    }),
  remove: (id) => api.delete(`/PeerFeedbackQueue/{queueId}${id}`),
  pending: () => api.get("/peerfeedbackqueue/pending"),
  approved: () => api.get("/peerfeedbackqueue/approved"),
  list: (page = 1, size = 20) =>
    api.get("/peerfeedbackqueue/all", {
      params: { pageNumber: page, pageSize: size },
    }),
};

// HR Forms & Responses
export const hrFormApi = {
  createForm: (body) => api.post("/hrfeedbackform/forms/create", body),
  getForm: (id) => api.get(`/hrfeedbackform/forms/${id}`),
  listForms: () => api.get("/hrfeedbackform/forms"),
  getActiveForms: () => api.get("/hrfeedbackform/forms/active"),
  updateForm: (id, body) => api.put(`/hrfeedbackform/forms/${id}`, body),
  removeForm: (id) => api.delete(`/hrfeedbackform/forms/${id}`),

  createResponse: (body) => api.post("/hrfeedbackform/responses/create", body),
  getResponse: (id) => api.get(`/hrfeedbackform/responses/${id}`),
  getResponsesByFormId: (formId) =>
    api.get(`/hrfeedbackform/responses/by-form/${formId}`),
  pendingReview: () => api.get("/hrfeedbackform/responses/pending-review"),
  updateResponse: (id, body) =>
    api.put(`/hrfeedbackform/responses/${id}`, body),
  submitResponse: (id) => api.post(`/hrfeedbackform/responses/${id}/submit`),
  hrReview: (id, { hrComments, reviewedByHRId }) =>
    api.post(`/hrfeedbackform/responses/${id}/hr-review`, null, {
      params: { hrComments, reviewedByHRId },
    }),
  deleteResponse: (id) => api.delete(`/hrfeedbackform/responses/${id}`),
};

// SME API (Subject Matter Experts / Mentors)
export const smeApi = {
  getActive: () => org_api.get("/sme/active"),
  getById: (smeId) => org_api.get(`/sme/${smeId}`),
  getBySkill: (skillId) => org_api.get(`/sme/skill/${skillId}`),
  getMyMentors: (employeeId) => org_api.get(`/sme/mentors/${employeeId}`),
  list: (page = 1, size = 20) =>
    org_api.get("/sme/all", { params: { pageNumber: page, pageSize: size } }),
};

// FEEDBACK ANALYSIS API
export const feedbackAnalysisApi = {
  analyze: async (sentence) => {
    try {
      const response = await fetch(import.meta.env.VITE_AI_API_URL+"/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing feedback:", error);
      throw error;
    }
  },
};

// Shared date helpers
export const dateHelpers = {
  daysRemaining: (iso) => {
    if (!iso) return 0;
    const d = new Date(iso),
      now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  },
  formatDeadline: (iso) => (iso ? new Date(iso).toLocaleString() : "N/A"),
  urgency: (iso) => {
    const d = new Date(iso),
      now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { status: "Overdue", color: "#E01950", icon: "⚠️" };
    if (diff <= 3) return { status: "Due Soon", color: "#E2B93B", icon: "⏳" };
    if (diff <= 7) return { status: "Upcoming", color: "#0F62FE", icon: "📅" };
    return { status: "On Track", color: "#24A148", icon: "✅" };
  },
};

// Base URLs
const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;
const LND_API_URL = import.meta.env.VITE_LND_API_URL;

// Employee API
export const employeeApi = {
  getAll: () =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/all`),

  getById: (employeeId) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/${employeeId}`),

  getByDepartment: (departmentId) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/department/${departmentId}`),

  getByRole: (roleId) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/role/${roleId}`),

  search: (query) =>
    axios.get(`${PROJECT_API_URL}/api/employeemanagement/search`, {
      params: { q: query },
    }),

  getSubordinates: async () => {
    try {
      // Get access token from storage (adjust as needed)
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${LND_API_URL}/api/lnd-skills/employees/subordinates`,
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


// Goals API
export const goalsApi = {
  getAll: () =>org_api.get("/Goals"),
  getById: (goalId) => org_api.get(`/Goals/${goalId}`),
  getTeamAll: () => org_api.get("/Goals/team/all"),
  getOrganizationLevel: () => org_api.get("/Goals/organization-level"),
  getByProject: (projectId) => org_api.get(`/Goals/project/${projectId}`),
};
