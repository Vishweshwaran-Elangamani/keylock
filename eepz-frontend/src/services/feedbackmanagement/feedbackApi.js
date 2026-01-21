import api from "./index_feedback";
import axios from "axios";
import org_api from "./index_org";

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

export const goalsApi = {
  getAll: () => org_api.get("/goals"),
  getById: (goalId) => org_api.get(`/goals/${goalId}`),
  getTeamAll: () => org_api.get("/goals/team"),
  getOrganizationLevel: () => org_api.get("/goals/organization-level"),
  getByProject: (projectId) => org_api.get(`/goals/project/${projectId}`),
};

export const mentorFeedbackApi = {
  create: (body) => org_api.post("/mentor-feedback", body),
  list: () => org_api.get("/mentor-feedback"),
  getById: (id) => org_api.get(`/mentor-feedback/${id}`),
  update: (id, body) => org_api.put(`/mentor-feedback/${id}`, body),
  remove: (id) => org_api.delete(`/mentor-feedback/${id}`),
  aboutMentor: (mentorEmployeeId) =>
    org_api.get(`/mentor-feedback/mentor/${mentorEmployeeId}`),
  byMentee: (menteeEmployeeId) =>
    org_api.get(`/mentor-feedback/mentee/${menteeEmployeeId}`),
  acknowledge: (id) => org_api.post(`/mentor-feedback/${id}/acknowledge`),
};

export const orgGoalFeedbackApi = {
  create: (body) => org_api.post("/org-goal-feedback", body),
  list: () => org_api.get("/org-goal-feedback"),
  getById: (id) => org_api.get(`/org-goal-feedback/${id}`),
  update: (id, body) => org_api.put(`/org-goal-feedback/${id}`, body),
  remove: (id) => org_api.delete(`/org-goal-feedback/${id}`),
  getByGoal: (goalId) => org_api.get(`/org-goal-feedback/goal/${goalId}`),
};

export const orgwideObjectivesApi = {
  getAll: () => org_api.get("/orgwide-objectives"),
  dropdown: () => org_api.get("/orgwide-objectives/dropdown"),
  getById: (objectiveId) =>
    org_api.get(`/orgwide-objectives/${objectiveId}`),
  active: () => org_api.get("/orgwide-objectives/active"),
  byStatus: (status) => org_api.get(`/orgwide-objectives/status/${status}`),
};

export const smeApi = {
  getActive: () => org_api.get("/smes/active"),
};

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
  remove: (id) => api.delete(`/peerfeedbackqueue/${id}`),
  pending: () => api.get("/peerfeedbackqueue/pending"),
  approved: () => api.get("/peerfeedbackqueue/approved"),
  list: (page = 1, size = 20) =>
    api.get("/peerfeedbackqueue/all", {
      params: { pageNumber: page, pageSize: size },
    }),
};

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

export const feedbackAnalysisApi = {
  analyze: async (sentence) => {
    const response = await fetch(import.meta.env.VITE_AI_API_URL + "/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return await response.json();
  },
};

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

const PROJECT_API_URL = import.meta.env.VITE_PROJECT_API_URL;
const LND_API_URL = import.meta.env.VITE_LND_API_URL;

export const employeeApi = {
  base: `${PROJECT_API_URL}/api/employees`,

  getEmployees: (params = {}) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, { params }),

  getAll: () => axios.get(`${PROJECT_API_URL}/api/employees`),

  getManagers: () =>
    axios.get(`${PROJECT_API_URL}/api/employees`, {
      params: { isManager: true },
    }),

  getById: (employeeId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/${employeeId}`),

  getByDepartment: (departmentId) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, { params: { departmentId } }),

  getByRole: (roleId) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, { params: { roleId } }),

  search: (searchTerm) =>
    axios.get(`${PROJECT_API_URL}/api/employees`, { params: { searchTerm } }),

  getAllDepartments: () =>
    axios.get(`${PROJECT_API_URL}/api/employees/departments`),

  getAllBusinessUnits: () =>
    axios.get(`${PROJECT_API_URL}/api/employees/business-units`),

  getInitialStage: () =>
    axios.get(`${PROJECT_API_URL}/api/employees/initial-stage`),

  mapToResourcePool: (employeeMasterIds) =>
    axios.post(`${PROJECT_API_URL}/api/employees/map-to-resource-pool`, {
      employeeMasterIds,
    }),

  getDepartmentById: (departmentId) =>
    axios.get(`${PROJECT_API_URL}/api/employees/departments/${departmentId}`),

  getSubordinates: async () => {
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
  },
};
