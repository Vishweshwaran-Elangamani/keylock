import api from "../hr/api.js";

export const getRewardTypes = () => api.get("/ManagerNomination/reward-types");



export const getOpportunities = () =>
  api.get("/ManagerNomination/opportunities");


export const getOpportunitiesByRewardType = (rewardTypeId) =>
  api.get(`/ManagerNomination/opportunities/${rewardTypeId}`);


export const getNominationParameters = (rewardTypeId) =>
  api.get(`/ManagerNomination/parameters/${rewardTypeId}`);


export const getTeamMembers = (managerId) =>
  api.get(`/ManagerNomination/team/${managerId}`);


export const submitNomination = (payload) =>
  api.post("/ManagerNomination/submit", payload);


export const getMyNominations = (managerId) =>
  api.get(`/ManagerNomination/my-nominations/${managerId}`);


export const getNominationDetails = (nominationId) =>
  api.get(`/ManagerNomination/nomination-details/${nominationId}`);
