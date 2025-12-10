using Microsoft.AspNetCore.Http;
using Relevantz.EEPZ.Common.DTOs;
using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Core.Services.Interface
{
    /// <summary>
    /// Defines goal lifecycle, progress tracking, approvals, file handling, comments, and related project operations.
    /// </summary>
    public interface IGoalModuleService
    {
        #region Goal lifecycle

        Task<ApiResponseDto<int>> CreateGoalAsync(
            CreateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<GoalDetailDto> GetGoalAsync(
            int goalId,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<List<GoalSummaryDto>> QueryGoalsAsync(
            GoalQueryDto query,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<ApiResponseDto> UpdateGoalAsync(
            int goalId,
            UpdateGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<List<AssigneeDto>> GetAssigneesAsync(int goalId);

        #endregion

        #region Assignments

        Task<ApiResponseDto> AssignAsync(
            int goalId,
            AssignGoalDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        #endregion

        #region Approvals

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

        Task<ApiResponseDto> RequestClosureAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<ApiResponseDto> RequestReactivationAsync(
            int goalId,
            CreateApprovalRequestDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<List<GoalApprovalDto>> GetPendingApprovalsAsync(int approverEmployeeMasterId);

        Task<PagedApprovalsDto> GetUserApprovalsAsync(
            ApprovalQueryDto query,
            int userId,
            string userRole
        );

        #endregion

        #region Checklist and progress

        Task<ApiResponseDto> ToggleChecklistAsync(
            int goalId,
            ToggleChecklistDto dto,
            int currentUserEmployeeMasterId
        );

        Task<ApiResponseDto> ManualUpdateProgressAsync(
            int goalId,
            ManualProgressUpdateDto dto,
            int currentUserEmployeeMasterId
        );

        Task<int> GetGoalProgressPercentAsync(int goalId, int forEmployeeMasterId);

        Task<int> GetTeamGoalProgressForManagerAsync(int goalId, int managerEmployeeMasterId);

        Task<int> GetCascadingProgressAsync(int goalId, int userId);

        Task<GoalProgressHierarchyDto> GetProgressHierarchyAsync(int goalId, int userId);

        #endregion

        #region Attachments and files

        Task<(byte[] fileBytes, string contentType, string fileName)?> PreviewFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );

        Task<List<GoalAttachment>> ListAttachmentsAsync(int goalId);

        Task<GoalAttachment> GetAttachmentAsync(int attachmentId);

        Task<FileUploadResponseDto> UploadFileAsync(
            int goalId,
            IFormFile file,
            string title,
            int currentUserEmployeeMasterId
        );

        Task<(byte[] fileBytes, string contentType, string fileName)> DownloadFileAsync(
            int attachmentId,
            int currentUserEmployeeMasterId
        );

        Task<bool> DeleteAttachmentAsync(int attachmentId, int currentUserEmployeeMasterId);

        #endregion

        #region Comments

        Task<ApiResponseDto> AddCommentAsync(
            int goalId,
            CreateCommentDto dto,
            int currentUserEmployeeMasterId,
            string currentUserRole
        );

        Task<List<GoalCommentDto>> ListCommentsAsync(int goalId);

        #endregion

        #region Dashboard and timeline

        Task<GoalDashboardSummaryDto> GetDashboardSummaryAsync(int currentUserEmployeeMasterId);

        Task<List<GoalSummaryDto>> GetOngoingAsync(string type, int currentUserEmployeeMasterId);

        Task<List<TimelineEventDto>> GetGoalTimelineAsync(
            int goalId,
            int currentUserEmployeeMasterId
        );

        #endregion

        #region Permissions and validation

        Task<bool> CanMarkCompleteAsync(int goalId, int employeeMasterId);

        Task<bool> CanViewGoalAsync(int goalId, int employeeMasterId);

        Task<bool> CanCommentOnGoalAsync(int goalId, int employeeMasterId, string role);

        #endregion

        #region Project operations

        Task<List<ProjectDto>> GetUserProjectsAsync(int employeeMasterId);

        Task<List<ProjectDto>> GetAllProjectsAsync();

        Task<ProjectDto> GetProjectAsync(int projectId);

        Task<List<ProjectEmployeeDto>> GetProjectSubordinatesAsync(
            int projectId,
            int managerEmployeeMasterId
        );

        #endregion
    }
}
