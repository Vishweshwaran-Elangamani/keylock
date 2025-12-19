import api from "../api/api";

export const getAllManagerNominations = () =>
  api.get("/HRNomination/hr/manager-nominations");

export const approveNominations = (payload) =>
  api.post("/HRNomination/hr/nominations/approve", payload);

export const getDashboardSummary = () =>
  api.get("/HRNomination/hr/dashboard/summary");

export const getNominationDetails = (nominationId) =>
  api.get(`/HRNomination/nomination-details/${nominationId}`);

export const getApprovedProfiles = () =>
  api.get("/HRNomination/approved-profiles");

export const getStatistics = () => api.get("/HRNomination/statistics");

export const getRewardTypes = (activeOnly = false) =>
  api.get("/HRNomination/reward-types", { params: { activeOnly } });

export const createRewardType = (payload) =>
  api.post("/HRNomination/reward-types", payload);


export const updateRewardType = (rewardTypeId, payload) =>
  api.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);


export const deleteRewardType = (rewardTypeId) =>
  api.delete(`/HRNomination/reward-types/${rewardTypeId}`);



export const getParametersByRewardType = (rewardTypeId) =>
  api.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);


export const createParameter = (payload) =>
  api.post("/HRNomination/parameters", payload);


export const updateParameter = (parameterId, payload) =>
  api.put(`/HRNomination/parameters/${parameterId}`, payload);


export const deleteParameter = (parameterId) =>
  api.delete(`/HRNomination/parameters/${parameterId}`);
