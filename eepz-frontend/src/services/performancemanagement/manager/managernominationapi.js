import api, { apiPort5113 } from "../hr/api.js";

// All ManagerNomination endpoints use port 5113
export const getRewardTypes = () => apiPort5113.get("/ManagerNomination/reward-types");

export const getOpportunities = () =>
  apiPort5113.get("/ManagerNomination/opportunities");

export const getOpportunitiesByRewardType = (rewardTypeId) =>
  apiPort5113.get(`/ManagerNomination/opportunities/${rewardTypeId}`);

export const getNominationParameters = (rewardTypeId) =>
  apiPort5113.get(`/ManagerNomination/parameters/${rewardTypeId}`);

export const getTeamMembers = (managerId) =>
  apiPort5113.get(`/ManagerNomination/team/${managerId}`);

export const submitNomination = (payload) =>
  apiPort5113.post("/ManagerNomination/submit", payload);

export const getMyNominations = (managerId) =>
  apiPort5113.get(`/ManagerNomination/my-nominations/${managerId}`);

export const getNominationDetails = (nominationId) =>
  apiPort5113.get(`/ManagerNomination/nomination-details/${nominationId}`);
