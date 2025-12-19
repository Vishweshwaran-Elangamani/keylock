import api, { apiPort5114 } from "../api/nominationapi";

// All ManagerNomination endpoints use port 5113
export const getRewardTypes = () => apiPort5114.get("/ManagerNomination/reward-types");

export const getOpportunities = () =>
  apiPort5114.get("/ManagerNomination/opportunities");

export const getOpportunitiesByRewardType = (rewardTypeId) =>
  apiPort5114.get(`/ManagerNomination/opportunities/${rewardTypeId}`);

export const getNominationParameters = (rewardTypeId) =>
  apiPort5114.get(`/ManagerNomination/parameters/${rewardTypeId}`);

export const getTeamMembers = (managerId) =>
  apiPort5114.get(`/ManagerNomination/team/${managerId}`);

export const submitNomination = (payload) =>
  apiPort5114.post("/ManagerNomination/submit", payload);

export const getMyNominations = (managerId) =>
  apiPort5114.get(`/ManagerNomination/my-nominations/${managerId}`);

export const getNominationDetails = (nominationId) =>
  apiPort5114.get(`/ManagerNomination/nomination-details/${nominationId}`);
