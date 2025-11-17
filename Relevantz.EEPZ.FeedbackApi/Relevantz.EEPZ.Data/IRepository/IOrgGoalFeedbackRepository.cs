using Relevantz.EEPZ.Common.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Relevantz.EEPZ.Data.Repository.Interfaces
{
    /// <summary>
    /// Repository for Organization Goal Feedback
    /// Uses Feedback table filtered by Goal.GoalType
    /// </summary>
    public interface IOrgGoalFeedbackRepository
    {
        // CREATE
        Task<int> CreateOrgGoalFeedbackAsync(Feedback feedback);

        // READ
        Task<Feedback> GetOrgGoalFeedbackByIdAsync(int feedbackId);
        Task<List<Feedback>> GetFeedbackByOrgGoalAsync(int goalId);
        Task<List<Feedback>> GetFeedbackBySubmitterAsync(int employeeId);
        Task<List<Feedback>> GetAllOrgGoalFeedbackAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<Feedback>> GetFeedbackByStatusAsync(string status);
        Task<List<Feedback>> GetAnonymousOrgGoalFeedbackAsync();

        // UPDATE
        Task<bool> UpdateOrgGoalFeedbackAsync(Feedback feedback);
        Task<bool> UpdateFeedbackStatusAsync(int feedbackId, string newStatus);

        // DELETE
        Task<bool> DeleteOrgGoalFeedbackAsync(int feedbackId);

        // VALIDATION
        Task<bool> OrgGoalFeedbackExistsAsync(int feedbackId);
    }
}
