using Relevantz.EEPZ.Common.DTOs.Request;
using Relevantz.EEPZ.Common.DTOs.Response;

namespace Relevantz.EEPZ.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Organization-Level Goal Feedback.
    /// Uses Feedback table filtered by Goal.GoalType = "org".
    /// </summary>
    public interface IOrgGoalFeedbackService
    {
        /// <summary>
        /// Creates a new organization goal feedback entry.
        /// </summary>
        Task<OrgGoalFeedbackResponseDto?> CreateOrgGoalFeedbackAsync(CreateOrgGoalFeedbackRequestDto dto);

        /// <summary>
        /// Retrieves an organization goal feedback entry by identifier.
        /// </summary>
        Task<OrgGoalFeedbackResponseDto?> GetOrgGoalFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Retrieves feedback entries for a given organization goal.
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByOrgGoalAsync(int goalId);

        /// <summary>
        /// Retrieves feedback entries submitted by an employee.
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Retrieves all organization goal feedback entries (paged).
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves organization goal feedback entries filtered by status.
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Retrieves anonymous organization goal feedback entries.
        /// </summary>
        Task<List<OrgGoalFeedbackResponseDto>> GetAnonymousOrgGoalFeedbackAsync();

        /// <summary>
        /// Updates an organization goal feedback entry.
        /// </summary>
        Task<OrgGoalFeedbackResponseDto?> UpdateOrgGoalFeedbackAsync(int feedbackId, UpdateOrgGoalFeedbackRequestDto dto);

        /// <summary>
        /// Archives an organization goal feedback entry.
        /// </summary>
        Task<bool> ArchiveOrgGoalFeedbackAsync(int feedbackId);

        /// <summary>
        /// Deletes an organization goal feedback entry.
        /// </summary>
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);

        /// <summary>
        /// Checks whether an organization goal feedback entry exists.
        /// </summary>
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}
