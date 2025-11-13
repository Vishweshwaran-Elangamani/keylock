import api from "./api";


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
 


export const getStatistics = () =>

  api.get("/HRNomination/statistics");
 


export const getRewardTypes = (activeOnly = false) =>

  api.get("/HRNomination/reward-types", { params: { activeOnly } });
 


export const createRewardType = (payload) =>

  api.post("/HRNomination/reward-types", payload);
 
// ✏️ Update reward type

export const updateRewardType = (rewardTypeId, payload) =>

  api.put(`/HRNomination/reward-types/${rewardTypeId}`, payload);
 
// ❌ Delete reward type

export const deleteRewardType = (rewardTypeId) =>

  api.delete(`/HRNomination/reward-types/${rewardTypeId}`);
 
// ============================================================

// NOMINATION PARAMETER MANAGEMENT

// ============================================================
 
// 📝 Get parameters by reward type

export const getParametersByRewardType = (rewardTypeId) =>

  api.get(`/HRNomination/reward-types/${rewardTypeId}/parameters`);
 
// ➕ Create new parameter

export const createParameter = (payload) =>

  api.post("/HRNomination/parameters", payload);
 
// ✏️ Update parameter

export const updateParameter = (parameterId, payload) =>

  api.put(`/HRNomination/parameters/${parameterId}`, payload);
 
// ❌ Delete parameter

export const deleteParameter = (parameterId) =>

  api.delete(`/HRNomination/parameters/${parameterId}`);



 



  

 