import api from "./api";

export const initiateAppraisal = (payload) =>
  api.post("/AppraisalProcess/initiate", payload);

export const getAppraisalsByFormId = (formId) =>
  api.get(`/AppraisalProcess/form/${formId}`);

export const getAppraisalByAssignmentId = (assignmentId) =>
  api.get(`/AppraisalProcess/${assignmentId}`);

export const getDeptHeadRatings = () =>
  api.get("/AppraisalProcess/depthead/submitted-ratings");
