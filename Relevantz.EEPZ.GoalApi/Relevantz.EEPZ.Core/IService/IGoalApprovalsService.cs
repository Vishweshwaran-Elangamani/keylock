using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalApprovalsService
    {
        Task<ApiResponseModel<int>> CreateApprovalRequest(
            int goalId,
            CreateApprovalRequestModel approvalRequestDetails,
            int requesterEmployeeMasterId,
            string requesterRole
        );
        Task<ApiResponseModel> ClosePendingApproval(
            int approvalId,
            ApprovalDesicionModel approvalDesicionDetails,
            int approverEmployeeMasterId,
            string approverRole
        );
        Task<List<GoalApprovalModel>> GetPendingApprovals(int approverEmployeeMasterId);
        Task<PagedApprovalsModel> GetUserApprovals(
            ApprovalQueryModel query,
            int userId,
            string userRole
        );
    }
}
