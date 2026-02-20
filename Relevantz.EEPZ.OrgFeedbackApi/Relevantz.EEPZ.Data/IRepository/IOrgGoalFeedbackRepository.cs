using Relevantz.EEPZ.Common.Entities;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository interface for Organization Goal Feedback operations.
    /// </summary>
    public interface IOrgGoalFeedbackRepository
    {
        /// <summary>
        /// Creates an organization goal feedback entry.
        /// </summary>
        Task<int> CreateOrgGoalFeedbackAsync(Feedback feedback);

        /// <summary>
        /// Retrieves an organization goal feedback entry by feedback identifier.
        /// </summary>
        Task<Feedback?> GetOrgGoalFeedbackByIdAsync(int feedbackId);

        /// <summary>
        /// Retrieves all feedback entries for a given organization goal with pagination.
        /// </summary>
        Task<List<Feedback>> GetFeedbackByOrgGoalAsync(int goalId, int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves all organization goal feedback entries submitted by an employee.
        /// </summary>
        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);

        /// <summary>
        /// Retrieves all organization goal feedback entries with pagination.
        /// </summary>
        Task<List<Feedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Retrieves organization goal feedback entries filtered by status.
        /// </summary>
        Task<List<Feedback>> GetFeedbackByStatusAsync(string status);

        /// <summary>
        /// Retrieves all anonymous organization goal feedback entries.
        /// </summary>
        Task<List<Feedback>> GetAnonymousOrgGoalFeedbackAsync();

        /// <summary>
        /// Updates an organization goal feedback entry.
        /// </summary>
        Task<bool> UpdateOrgGoalFeedbackAsync(Feedback feedback);

        /// <summary>
        /// Updates the status of an organization goal feedback entry.
        /// </summary>
        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

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
