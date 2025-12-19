import api from "../api/api";

export const initiateAppraisal = (payload) =>
  api.post("/Assignments/initiate", payload);

export const getAppraisalsByFormId = (formId) =>
  api.get(`/Assignments/form/${formId}`);

export const getAppraisalByAssignmentId = (assignmentId) =>
  api.get(`/Assignments/${assignmentId}`);

export const getDeptHeadRatings = () =>
  api.get("/DeptHeadApprovals/depthead/submitted-ratings");

