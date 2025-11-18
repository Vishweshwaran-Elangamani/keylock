import api from "./api";

// Initiate a new appraisal process
export const initiateAppraisal = (payload) =>
  api.post("/AppraisalProcess/initiate", payload);

// Get appraisals by form ID
export const getAppraisalsByFormId = (formId) =>
  api.get(`/AppraisalProcess/form/${formId}`);

// Get appraisal by assignment ID
export const getAppraisalByAssignmentId = (assignmentId) =>
  api.get(`/AppraisalProcess/${assignmentId}`);

// Get department head submitted ratings
export const getDeptHeadRatings = () =>
  api.get("/AppraisalProcess/depthead/submitted-ratings");
