using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    public interface IGoalApprovalsService
    {
        Task<ApiResponseDto<int>> RequestApprovalAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int requesterEmployeeMasterId,
            string requesterRole
        );
        Task<ApiResponseDto> DecideApprovalAsync(
            int approvalId,
            DecideApprovalDto dto,
            int approverEmployeeMasterId,
            string approverRole
        );
        Task<List<GoalApprovalDto>> GetPendingApprovalsAsync(int approverEmployeeMasterId);
        Task<PagedApprovalsDto> GetUserApprovalsAsync(
            ApprovalQueryDto query,
            int userId,
            string userRole
        );
    }
}
