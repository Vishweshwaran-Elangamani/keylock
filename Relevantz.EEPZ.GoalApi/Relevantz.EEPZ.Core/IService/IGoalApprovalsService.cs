using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Entities;
using Relevantz.EEPZ.Common.Models;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalApprovalsService
    {
        Task<ApiResponseModel<int>> CreateApprovalRequestAsync(
            int goalId,
            CreateApprovalRequestModel approvalRequestDetails,
            int requesterEmployeeMasterId,
            string requesterRole
        );
        Task<ApiResponseModel> ClosePendingApprovalAsync(
            int approvalId,
            ApprovalDesicionModel approvalDesicionDetails,
            int approverEmployeeMasterId,
            string approverRole
        );
        Task<List<GoalApprovalModel>> GetPendingApprovalsAsync(int approverEmployeeMasterId);
        Task<PagedApprovalsModel> GetUserApprovalsAsync(
            ApprovalQueryModel query,
            int userId,
            string userRole
        );
    }
}
