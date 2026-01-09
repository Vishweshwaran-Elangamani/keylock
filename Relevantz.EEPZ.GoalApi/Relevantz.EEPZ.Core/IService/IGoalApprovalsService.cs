using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.Models;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalApprovalsService
    {
        Task<ApiResponseModel<int>> RequestApprovalAsync(
            int goalId,
            CreateApprovalRequestModel dto,
            int requesterEmployeeMasterId,
            string requesterRole
        );
        Task<ApiResponseModel> DecideApprovalAsync(
            int approvalId,
            DecideApprovalModel dto,
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
