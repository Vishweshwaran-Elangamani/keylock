import api from "./api";

export function getApproverAssessmentsWithDetails(
  approverUserId,
  page = 1,
  pageSize = 25
) {
  return api.get(`/approver/${approverUserId}/assessments`, {
    params: { page, pageSize },
  });
}

export function submitApproverRating(approverUserId, payload) {
  return api.post(`/approver/${approverUserId}/reviews`, payload);
}

export default api;
