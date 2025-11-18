// Use the shared axios instance so baseURL, interceptors and auth are consistent
// from this path (src/services/performancemanagement/manager) go up two levels to src/services
import api from "../hr/api.js";

export const getRewardTypes = () => api.get("/ManagerNomination/reward-types");

//  Get all active opportunities

export const getOpportunities = () =>
  api.get("/ManagerNomination/opportunities");

//  Get opportunities filtered by reward type

export const getOpportunitiesByRewardType = (rewardTypeId) =>
  api.get(`/ManagerNomination/opportunities/${rewardTypeId}`);

//  Get nomination parameters for a reward type

export const getNominationParameters = (rewardTypeId) =>
  api.get(`/ManagerNomination/parameters/${rewardTypeId}`);

// 👥 Get manager's team members for nomination

export const getTeamMembers = (managerId) =>
  api.get(`/ManagerNomination/team/${managerId}`);

//  Submit a new nomination

export const submitNomination = (payload) =>
  api.post("/ManagerNomination/submit", payload);

//  Get all nominations submitted by a manager

export const getMyNominations = (managerId) =>
  api.get(`/ManagerNomination/my-nominations/${managerId}`);

//  Get detailed nomination information

export const getNominationDetails = (nominationId) =>
  api.get(`/ManagerNomination/nomination-details/${nominationId}`);
